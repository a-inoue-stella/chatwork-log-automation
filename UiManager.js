/**
 * UiManager: サイドバーUIとバックエンドロジックの橋渡しを行う
 */

// サイドバーを表示する
function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('Chatwork資産化設定')
    .setWidth(300);
  DocumentApp.getUi().showSidebar(html);
}

// フロントエンドへ設定値を渡す
function getSettings() {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('CHATWORK_API_TOKEN') || '';
  const roomsJson = props.getProperty('TARGET_ROOMS_CONFIG');
  const rooms = roomsJson ? JSON.parse(roomsJson) : [];
  
  // 現在トリガーがセットされているか確認
  const isTriggerActive = hasTrigger();

  return {
    token: token,
    rooms: rooms,
    isTriggerActive: isTriggerActive
  };
}

// トリガーの設定・解除（10分間隔固定）
function updateTrigger(shouldEnable) {
  const FUNCTION_NAME = 'fetchAndStockChatwork';
  
  // 1. 既存のトリガーを全て削除（重複防止）
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === FUNCTION_NAME) {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // 2. ONの場合のみ、新規トリガー作成
  if (shouldEnable) {
    ScriptApp.newTrigger(FUNCTION_NAME)
      .timeBased()
      .everyMinutes(10) // ここで10分間隔を指定
      .create();
    return '自動収集を開始しました（10分間隔）';
  } else {
    return '自動収集を停止しました';
  }
}

// トリガー有無の判定ヘルパー
function hasTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  return triggers.some(t => t.getHandlerFunction() === 'fetchAndStockChatwork');
}

// APIトークンを保存
function saveApiToken(token) {
  PropertiesService.getScriptProperties().setProperty('CHATWORK_API_TOKEN', token);
}

// ルーム設定を保存
function saveRoomSettings(rooms) {
  PropertiesService.getScriptProperties().setProperty('TARGET_ROOMS_CONFIG', JSON.stringify(rooms));
}

// 手動実行
function runFromSidebar() {
  try {
    fetchAndStockChatwork(); // main.jsの関数
    return '完了しました';
  } catch (e) {
    return 'エラー: ' + e.message;
  }
}