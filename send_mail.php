<?php
declare(strict_types=1);

// 1. Подавление системного вывода ошибок для защиты от раскрытия структуры путей (Information Disclosure)
ini_set('display_errors', '0');
error_reporting(E_ALL);

// 2. Строгий белый список CORS с валидацией Origin
$allowedOrigins = [
    'https://ferro-design.ru',
    'https://www.ferro-design.ru',
    'https://refunde.github.io'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (!empty($origin)) {
    $isAllowed = in_array(rtrim($origin, '/'), $allowedOrigins, true);
    // Разрешаем локальную разработку (localhost, 127.0.0.1 с любым портом)
    if (!$isAllowed && preg_match('#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#i', $origin)) {
        $isAllowed = true;
    }

    if ($isAllowed) {
        header("Access-Control-Allow-Origin: {$origin}");
        header('Access-Control-Allow-Methods: POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
        header('Access-Control-Max-Age: 86400');
        header('Vary: Origin');
    } else {
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'status' => 'error',
            'message' => 'Origin not allowed'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// 3. Обработка preflight-запроса OPTIONS
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

header('Content-Type: application/json; charset=utf-8');

// 4. Разрешаем только POST-запросы
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Method not allowed'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 5. Защита от DoS по размеру полезной нагрузки (максимум 64 КБ = 65536 байт)
$contentLength = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($contentLength > 65536) {
    http_response_code(413);
    echo json_encode([
        'status' => 'error',
        'message' => 'Payload too large (максимум 64 КБ)'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 6. Проверка honeypot-ловушки для спам-ботов
$honeypot = trim((string)($_POST['website'] ?? ''));
if (!empty($honeypot)) {
    // Тихо возвращаем успех, не отправляя спам
    echo json_encode(['status' => 'ok', 'message' => 'Processed'], JSON_UNESCAPED_UNICODE);
    exit;
}

// 7. Файловый атомарный Rate Limiter по IP (максимум 5 заявок за 10 минут, пауза минимум 5 секунд)
function check_rate_limit(): bool {
    $clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $ipHash = hash('sha256', $clientIp);
    $limitDir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'ferro_rate_limits';

    if (!is_dir($limitDir) && !@mkdir($limitDir, 0700, true) && !is_dir($limitDir)) {
        // Если временная папка недоступна, не блокируем легитимных клиентов
        return true;
    }

    $filePath = $limitDir . DIRECTORY_SEPARATOR . "rl_{$ipHash}.json";
    $fp = @fopen($filePath, 'c+');
    if (!$fp) {
        return true;
    }

    if (!@flock($fp, LOCK_EX)) {
        @fclose($fp);
        return true;
    }

    $now = time();
    $windowSeconds = 600; // 10 минут
    $minIntervalSeconds = 5; // минимум 5 секунд между запросами
    $maxRequests = 5; // максимум 5 заявок

    $data = [];
    $raw = stream_get_contents($fp);
    if (!empty($raw)) {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            $data = $decoded;
        }
    }

    // Очищаем метки старше 10 минут
    $timestamps = array_values(array_filter($data, function($t) use ($now, $windowSeconds) {
        return is_int($t) && ($now - $t) <= $windowSeconds;
    }));

    // Проверка интервала с предыдущего запроса
    if (!empty($timestamps)) {
        $lastRequest = end($timestamps);
        if (($now - $lastRequest) < $minIntervalSeconds) {
            @flock($fp, LOCK_UN);
            @fclose($fp);
            return false;
        }
    }

    // Проверка общего количества запросов за окно
    if (count($timestamps) >= $maxRequests) {
        @flock($fp, LOCK_UN);
        @fclose($fp);
        return false;
    }

    // Записываем новый timestamp
    $timestamps[] = $now;
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($timestamps));
    fflush($fp);
    @flock($fp, LOCK_UN);
    @fclose($fp);

    return true;
}

if (!check_rate_limit()) {
    http_response_code(429);
    echo json_encode([
        'status' => 'error',
        'message' => 'Слишком много запросов. Пожалуйста, подождите несколько минут перед повторной отправкой.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 8. Вспомогательные функции санитизации и усечения полей
function clean_single_line(?string $value, int $maxLength = 100): string {
    if ($value === null) return '';
    // Удаляем переводы строк для защиты от инъекций заголовков (CRLF injection)
    $val = str_replace(["\r", "\n", "\0"], ' ', trim($value));
    $val = strip_tags($val);
    if (function_exists('mb_substr')) {
        $val = mb_substr($val, 0, $maxLength, 'UTF-8');
    } else {
        $val = substr($val, 0, $maxLength);
    }
    return htmlspecialchars($val, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function clean_multi_line(?string $value, int $maxLength = 3000): string {
    if ($value === null) return '';
    // Удаляем опасные нулевые байты
    $val = str_replace("\0", '', trim($value));
    // Нормализуем переводы строк к \n
    $val = str_replace(["\r\n", "\r"], "\n", $val);
    $val = strip_tags($val);
    if (function_exists('mb_substr')) {
        $val = mb_substr($val, 0, $maxLength, 'UTF-8');
    } else {
        $val = substr($val, 0, $maxLength);
    }
    return htmlspecialchars($val, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

// Извлечение и санитизация входящих параметров
$name     = clean_single_line((string)($_POST['name'] ?? ''), 100);
$contact  = clean_single_line((string)($_POST['contact'] ?? $_POST['phone'] ?? ''), 120);
$city     = clean_single_line((string)($_POST['city'] ?? ''), 100);
$area     = clean_single_line((string)($_POST['area'] ?? ''), 50);
$comment  = clean_multi_line((string)($_POST['comment'] ?? $_POST['message'] ?? ''), 3000);
$pageUrl  = clean_single_line((string)($_POST['page_url'] ?? $_POST['page'] ?? ''), 500);

// Валидация обязательных полей
if (empty($name) && empty($contact)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Не заполнены обязательные контактные данные (имя или телефон/мессенджер)'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$clientName = !empty($name) ? $name : 'Клиент';

// 9. Формирование темы и HTML-тела письма
$to = 'artem1-nt@mail.ru';
$subject = 'Новая заявка с сайта FERRO DESIGN — ' . $clientName;
$subjectEncoded = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$sendTime = date('d.m.Y H:i:s');

$htmlBody = <<<HTML
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Заявка FERRO DESIGN</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #faf9f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0d0d0d;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #EBECEC; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06);">
    <tr>
      <td style="padding: 32px 36px; background-color: #434242; color: #EBECEC;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">FERRO DESIGN</h1>
        <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.8; letter-spacing: 0.04em; text-transform: uppercase;">Новая заявка на дизайн-проект</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 36px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 15px; line-height: 1.6;">
          <tr>
            <td style="padding: 8px 0; color: #888888; width: 140px; font-size: 13px; text-transform: uppercase;">Имя клиента:</td>
            <td style="padding: 8px 0; font-weight: 600; color: #0d0d0d;">{$clientName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888888; font-size: 13px; text-transform: uppercase;">Телефон / Контакт:</td>
            <td style="padding: 8px 0; font-weight: 600; color: #0d0d0d;">{$contact}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888888; font-size: 13px; text-transform: uppercase;">Город:</td>
            <td style="padding: 8px 0; color: #0d0d0d;">{$city}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888888; font-size: 13px; text-transform: uppercase;">Площадь:</td>
            <td style="padding: 8px 0; color: #0d0d0d;">{$area}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888888; font-size: 13px; text-transform: uppercase; vertical-align: top;">Комментарий:</td>
            <td style="padding: 8px 0; color: #0d0d0d; white-space: pre-wrap;">{$comment}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888888; font-size: 13px; text-transform: uppercase;">Страница:</td>
            <td style="padding: 8px 0; color: #666666; font-size: 13px;"><a href="{$pageUrl}" target="_blank" style="color: #434242;">{$pageUrl}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888888; font-size: 13px; text-transform: uppercase;">Дата и время:</td>
            <td style="padding: 8px 0; color: #888888; font-size: 13px;">{$sendTime}</td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 36px; background-color: #faf9f7; border-top: 1px solid #EBECEC; font-size: 12px; color: #888888; text-align: center;">
        Студия интерьерного дизайна FERRO DESIGN &bull; ИП Соколова Н.В.
      </td>
    </tr>
  </table>
</body>
</html>
HTML;

// 10. Формирование безопасных заголовков письма
$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'From: FERRO DESIGN <no-reply@ferro-design.ru>',
    'X-Mailer: PHP/' . phpversion()
];

// Проверяем валидность email в контакте перед установкой Reply-To
$rawContact = trim((string)($_POST['contact'] ?? $_POST['phone'] ?? ''));
if (filter_var($rawContact, FILTER_VALIDATE_EMAIL)) {
    $cleanReplyTo = str_replace(["\r", "\n", "\0"], '', $rawContact);
    $headers[] = 'Reply-To: ' . $cleanReplyTo;
} else {
    $headers[] = 'Reply-To: ' . $to;
}

// 11. Отправка через встроенную функцию mail() с try / catch и проверкой результата
try {
    $headersStr = implode("\r\n", $headers);
    $sent = @mail($to, $subjectEncoded, $htmlBody, $headersStr);

    if (!$sent) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Не удалось отправить почтовое сообщение через сервер'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    http_response_code(200);
    echo json_encode([
        'status' => 'ok',
        'message' => 'Заявка успешно отправлена'
    ], JSON_UNESCAPED_UNICODE);
} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Внутренняя ошибка сервиса отправки сообщений'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
