<?php
declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, Idempotency-Key');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

define('DATA_DIR', __DIR__ . '/storage');
define('ORDERS_FILE', DATA_DIR . '/orders.json');

if (!is_dir(DATA_DIR)) {
    mkdir(DATA_DIR, 0777, true);
}
if (!file_exists(ORDERS_FILE)) {
    file_put_contents(ORDERS_FILE, json_encode([]));
}

$adminPassword = getenv('ADMIN_PASSWORD') ?: 'changeme123';
$adminToken = 'fd_' . substr(hash('sha256', $adminPassword . 'flashdelivery'), 0, 32);

$menus = [
    [
        'id' => 1,
        'name' => '클래식 와규 치즈버거',
        'price' => 12900,
        'is_sold_out' => false,
        'image' => 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop',
        'description' => '육즙 가득한 와규 패티와 진한 체다 치즈의 환상적인 조화',
        'tag' => '인기',
        'options' => [
            [
                'id' => 'patty',
                'name' => '패티 추가',
                'required' => false,
                'maxSelect' => 1,
                'choices' => [
                    ['id' => 'patty_single', 'label' => '기본', 'price' => 0],
                    ['id' => 'patty_double', 'label' => '더블 패티', 'price' => 3900],
                ],
            ],
            [
                'id' => 'cheese',
                'name' => '치즈 추가',
                'required' => false,
                'maxSelect' => 2,
                'choices' => [
                    ['id' => 'cheddar', 'label' => '체다 치즈', 'price' => 800],
                    ['id' => 'gouda', 'label' => '고다 치즈', 'price' => 900],
                ],
            ],
        ],
    ],
    [
        'id' => 2,
        'name' => '트러플 파마산 프라이',
        'price' => 7500,
        'is_sold_out' => false,
        'image' => 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?q=80&w=800&auto=format&fit=crop',
        'description' => '고급스러운 트러플 향이 가득한 바삭한 감자튀김',
        'tag' => '사이드',
        'options' => [
            [
                'id' => 'size',
                'name' => '사이즈',
                'required' => true,
                'maxSelect' => 1,
                'choices' => [
                    ['id' => 'regular', 'label' => '레귤러', 'price' => 0],
                    ['id' => 'large', 'label' => '라지', 'price' => 1500],
                ],
            ],
        ],
    ],
    [
        'id' => 3,
        'name' => '나이트로 콜드브루',
        'price' => 5500,
        'is_sold_out' => true,
        'image' => 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=800&auto=format&fit=crop',
        'description' => '부드러운 질감과 깔끔한 뒷맛의 질소 커피',
        'tag' => '품절',
        'options' => [
            [
                'id' => 'ice',
                'name' => '얼음량',
                'required' => false,
                'maxSelect' => 1,
                'choices' => [
                    ['id' => 'ice_normal', 'label' => '보통', 'price' => 0],
                    ['id' => 'ice_less', 'label' => '적게', 'price' => 0],
                ],
            ],
            [
                'id' => 'shot',
                'name' => '샷 추가',
                'required' => false,
                'maxSelect' => 2,
                'choices' => [
                    ['id' => 'shot1', 'label' => '1샷', 'price' => 500],
                    ['id' => 'shot2', 'label' => '2샷', 'price' => 1000],
                ],
            ],
        ],
    ],
];

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';

function jsonResponse($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

function readJsonBody(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function loadOrders(): array
{
    $json = file_get_contents(ORDERS_FILE) ?: '[]';
    $data = json_decode($json, true);
    return is_array($data) ? $data : [];
}

function saveOrders(array $orders): void
{
    file_put_contents(ORDERS_FILE, json_encode($orders, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
}

function findMenu(int $id, array $menus): ?array
{
    foreach ($menus as $menu) {
        if ((int)$menu['id'] === $id) {
            return $menu;
        }
    }
    return null;
}

function calculateItems(array $rawItems, array $menus): array
{
    $items = [];
    $totalPrice = 0;

    foreach ($rawItems as $raw) {
        $menuId = (int)($raw['menu_id'] ?? 0);
        $qty = max(1, (int)($raw['quantity'] ?? 1));
        $menu = findMenu($menuId, $menus);
        if (!$menu) {
            continue;
        }

        $optionSelections = $raw['options'] ?? [];
        $optionPricePerUnit = 0;

        $optionsById = [];
        foreach ($menu['options'] ?? [] as $opt) {
            $optionsById[$opt['id']] = $opt;
        }

        foreach ($optionSelections as $selection) {
            $optionId = $selection['option_id'] ?? '';
            $choiceIds = $selection['choice_ids'] ?? [];
            if (!isset($optionsById[$optionId])) {
                continue;
            }
            $opt = $optionsById[$optionId];
            $choicesById = [];
            foreach ($opt['choices'] as $c) {
                $choicesById[$c['id']] = $c;
            }
            foreach ($choiceIds as $cid) {
                if (isset($choicesById[$cid])) {
                    $optionPricePerUnit += (float)$choicesById[$cid]['price'];
                }
            }
        }

        $unitPrice = (float)$menu['price'];
        $linePrice = ($unitPrice + $optionPricePerUnit) * $qty;
        $totalPrice += $linePrice;

        $items[] = [
            'menu_id' => $menuId,
            'quantity' => $qty,
            'options' => $optionSelections,
            'unit_price' => $unitPrice,
            'options_price' => $optionPricePerUnit,
            'line_price' => $linePrice,
            'menu_name' => $menu['name'],
        ];
    }

    return [$items, $totalPrice];
}

function requireAdminAuth(string $token): void
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s+(.*)/i', $header, $matches) && $matches[1] === $token) {
        return;
    }
    jsonResponse(['error' => 'unauthorized'], 401);
}

switch (true) {
    case $method === 'GET' && $path === '/':
        jsonResponse(['status' => 'ok']);

    case $method === 'POST' && $path === '/admin/login':
        $body = readJsonBody();
        if (($body['password'] ?? '') === $adminPassword) {
            jsonResponse(['token' => $adminToken]);
        }
        jsonResponse(['error' => 'invalid_credentials'], 401);

    case $method === 'GET' && $path === '/menus':
        jsonResponse($menus);

    case $method === 'POST' && $path === '/orders':
        $body = readJsonBody();
        $address = trim((string)($body['address'] ?? ''));
        $phone = preg_replace('/\D+/', '', (string)($body['phone'] ?? ''));
        $paymentMethod = $body['payment_method'] ?? 'card';

        $rawItems = $body['items'] ?? [];
        if (empty($rawItems) && isset($body['menu_id'])) {
            $rawItems = [[
                'menu_id' => (int)$body['menu_id'],
                'quantity' => 1,
                'options' => [],
            ]];
        }

        if (empty($rawItems) || $address === '' || $phone === '') {
            jsonResponse(['error' => 'invalid_payload'], 422);
        }

        [$items, $totalPrice] = calculateItems($rawItems, $menus);
        if (empty($items)) {
            jsonResponse(['error' => 'invalid_items'], 422);
        }

        $orders = loadOrders();
        $idempotencyKey = $_SERVER['HTTP_IDEMPOTENCY_KEY'] ?? null;

        if ($idempotencyKey) {
            foreach ($orders as $existing) {
                if (!empty($existing['idempotency_key']) && $existing['idempotency_key'] === $idempotencyKey) {
                    jsonResponse(['success' => true, 'tracking_uuid' => $existing['tracking_uuid']], 200);
                }
            }
        }

        $id = empty($orders) ? 1 : (max(array_column($orders, 'id')) + 1);
        $tracking = bin2hex(random_bytes(12));

        $newOrder = [
            'id' => $id,
            'customer_phone' => $phone,
            'customer_address' => $address,
            'menu_id' => $items[0]['menu_id'],
            'items' => $items,
            'total_price' => $totalPrice,
            'status' => 'pending',
            'order_time' => gmdate('c'),
            'delivery_eta' => null,
            'tracking_uuid' => $tracking,
            'idempotency_key' => $idempotencyKey,
            'payment_method' => $paymentMethod,
        ];

        $orders[] = $newOrder;
        saveOrders($orders);

        jsonResponse(['success' => true, 'tracking_uuid' => $tracking], 201);

    case $method === 'GET' && preg_match('#^/orders/([A-Za-z0-9_-]+)$#', $path, $matches):
        $uuid = $matches[1];
        $orders = loadOrders();
        foreach ($orders as $order) {
            if (($order['tracking_uuid'] ?? '') === $uuid) {
                jsonResponse($order);
            }
        }
        jsonResponse(null, 404);

    case $method === 'GET' && $path === '/admin/orders':
        requireAdminAuth($adminToken);
        $orders = loadOrders();
        usort($orders, static function ($a, $b) {
            return strtotime($b['order_time']) <=> strtotime($a['order_time']);
        });
        jsonResponse($orders);

    case $method === 'PATCH' && preg_match('#^/admin/orders/(\d+)$#', $path, $matches):
        requireAdminAuth($adminToken);
        $orderId = (int)$matches[1];
        $body = readJsonBody();
        $status = $body['status'] ?? null;

        if (!$status) {
            jsonResponse(['error' => 'invalid_status'], 422);
        }

        $etaMinutes = isset($body['eta_minutes']) ? (int)$body['eta_minutes'] : null;
        $orders = loadOrders();
        $updated = false;

        foreach ($orders as &$order) {
            if ((int)$order['id'] === $orderId) {
                $order['status'] = $status;
                if ($etaMinutes !== null) {
                    $eta = new DateTime('now', new DateTimeZone('UTC'));
                    $eta->modify("+{$etaMinutes} minutes");
                    $order['delivery_eta'] = $eta->format(DateTime::ATOM);
                }
                $updated = true;
                break;
            }
        }
        unset($order);

        if (!$updated) {
            jsonResponse(['error' => 'order_not_found'], 404);
        }

        saveOrders($orders);
        jsonResponse(['success' => true]);

    default:
        jsonResponse(['error' => 'not_found'], 404);
}
