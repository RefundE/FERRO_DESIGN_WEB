<?php
declare(strict_types=1);

// CORS заголовки и обработка preflight-запроса OPTIONS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

header('Content-Type: application/json; charset=utf-8');

// Разрешаем только POST запросы
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
    exit;
}

// 1. Проверка honeypot-ловушки для спам-ботов
$honeypot = trim($_POST['website'] ?? '');
if (!empty($honeypot)) {
    // Тихо возвращаем успех, не отправляя спам
    echo json_encode(['status' => 'ok', 'message' => 'Processed'], JSON_UNESCAPED_UNICODE);
    exit;
}

// 2. Вспомогательная функция санитизации полей с защитой от инъекций заголовков (\r, \n)
function clean_field(?string $value): string {
    if ($value === null) return '';
    $val = str_replace(["\r", "\n"], ' ', trim($value));
    return htmlspecialchars(strip_tags($val), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

$name     = clean_field($_POST['name'] ?? '');
$contact  = clean_field($_POST['contact'] ?? $_POST['phone'] ?? '');
$city     = clean_field($_POST['city'] ?? '');
$area     = clean_field($_POST['area'] ?? '');
$comment  = clean_field($_POST['comment'] ?? $_POST['message'] ?? '');
$pageUrl  = clean_field($_POST['page_url'] ?? $_POST['page'] ?? '');

// Валидация обязательных полей
if (empty($name) && empty($contact)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Не заполнены обязательные контактные данные (имя или телефон/Telegram)'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Если имя пустое, задаем значение по умолчанию
$clientName = !empty($name) ? $name : 'Клиент';

// 3. Формирование темы и тела HTML-письма
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
            <td style="padding: 8px 0; color: #888888; font-size: 13px; text-transform: uppercase;">Телефон / TG:</td>
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

// 4. Заголовки письма
$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'From: FERRO DESIGN <no-reply@ferro-design.ru>',
    'X-Mailer: PHP/' . phpversion()
];

if (!empty($contact) && filter_var($contact, FILTER_VALIDATE_EMAIL)) {
    $headers[] = 'Reply-To: ' . $contact;
} else {
    $headers[] = 'Reply-To: ' . $to;
}

// 5. Отправка через встроенную функцию mail() с проверкой результата
$sent = @mail($to, $subjectEncoded, $htmlBody, implode("\r\n", $headers));
if (!$sent) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Не удалось отправить почтовое сообщение через сервер'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 6. JSON-ответ клиенту
http_response_code(200);
echo json_encode([
    'status' => 'ok',
    'message' => 'Заявка успешно отправлена'
], JSON_UNESCAPED_UNICODE);
