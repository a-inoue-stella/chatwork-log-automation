/**
 * UiManager: サイドバーUIとバックエンドロジックの橋渡しを行う
 */

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('Chatwork資産化設定')
    .setWidth(300);
  DocumentApp.getUi().showSidebar(html);
}

function getSettings() {
  const props = PropertiesService.getScriptProperties();
  return {
    token: props.getProperty('CHATWORK_API_TOKEN') || '',
    rooms: JSON.parse(props.getProperty('TARGET_ROOMS_CONFIG') || '[]'),
    logSheetId: props.getProperty('LOG_SHEET_ID') || '', // ★追加
    isTriggerActive: hasTrigger()
  };
}

// --- 保存用関数群 ---

function saveApiToken(token) {
  PropertiesService.getScriptProperties().setProperty('CHATWORK_API_TOKEN', token);
}

function saveRoomSettings(rooms) {
  PropertiesService.getScriptProperties().setProperty('TARGET_ROOMS_CONFIG', JSON.stringify(rooms));
}

// ★追加: ログシートIDの保存
function saveLogSheetId(id) {
  PropertiesService.getScriptProperties().setProperty('LOG_SHEET_ID', id);
}

// --- トリガー関連 ---

function updateTrigger(shouldEnable) {
  const FUNCTION_NAME = 'fetchAndStockChatwork';
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    if (t.getHandlerFunction() === FUNCTION_NAME) ScriptApp.deleteTrigger(t);
  });

  if (shouldEnable) {
    ScriptApp.newTrigger(FUNCTION_NAME).timeBased().everyMinutes(10).create();
    return '自動収集を開始しました（10分間隔）';
  } else {
    return '自動収集を停止しました';
  }
}

function hasTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  return triggers.some(t => t.getHandlerFunction() === 'fetchAndStockChatwork');
}

function runFromSidebar() {
  try {
    fetchAndStockChatwork();
    return '完了しました';
  } catch (e) {
    return 'エラー: ' + e.message;
  }
}