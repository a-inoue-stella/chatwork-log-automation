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
  const rooms = roomsJson ? JSON.parse(roomsJson) : []; // 初期値は空
  
  return {
    token: token,
    rooms: rooms
  };
}

// APIトークンを保存
function saveApiToken(token) {
  PropertiesService.getScriptProperties().setProperty('CHATWORK_API_TOKEN', token);
}

// ルーム設定を保存
function saveRoomSettings(rooms) {
  PropertiesService.getScriptProperties().setProperty('TARGET_ROOMS_CONFIG', JSON.stringify(rooms));
}

// サイドバーからの手動実行トリガー
function runFromSidebar() {
  try {
    // main.js の fetchAndStockChatwork を呼び出す
    // ※Config.jsがPropertiesServiceを参照するように改修されている前提
    fetchAndStockChatwork(); 
    return '完了しました';
  } catch (e) {
    return 'エラー: ' + e.message;
  }
}

// UiManager.gs の末尾に追加

function saveSchedule(scheduleConfig) {
  // モックアップ段階ではプロパティに保存するフリだけ行う、
  // または実際にScriptApp.newTriggerでトリガーを設定するロジックをここに書く
  PropertiesService.getScriptProperties().setProperty('SCHEDULE_CONFIG', JSON.stringify(scheduleConfig));
  
  // ※本実装時はここにトリガー削除＆再登録ロジックが入ります
  return true; 
}