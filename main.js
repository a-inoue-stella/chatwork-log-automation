/**
 * ドキュメントオープン時に実行される関数
 */
function onOpen() {
  DocumentApp.getUi()
    .createMenu('Chatwork資産化')
    .addItem('設定サイドバーを開く', 'showSidebar')
    .addItem('今すぐ手動実行', 'fetchAndStockChatwork')
    .addToUi();
}

/**
 * メイン関数: 定期実行トリガーまたは手動実行から呼ばれる
 */
function fetchAndStockChatwork() {
  // 1. 設定読み込み
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('CHATWORK_API_TOKEN');
  const roomsJson = props.getProperty('TARGET_ROOMS_CONFIG');
  
  if (!token || !roomsJson) {
    console.warn('設定未完了: サイドバーから設定を行ってください。');
    return;
  }
  
  const rooms = JSON.parse(roomsJson);
  const doc = DocumentApp.getActiveDocument(); // ここでドキュメントを取得

  // 2. ルームごとに処理
  rooms.forEach(room => {
    try {
      processRoomLog(token, room, doc); // docを渡す
    } catch (e) {
      console.error(`Error in Room ${room.id}: ${e.message}`);
    }
  });
}

/**
 * 個別ルームの処理ロジック
 */
function processRoomLog(token, room, doc) {
  const client = new ChatworkClient(token);
  
  // A. 最新100件取得 (force=1)
  const messages = client.fetchMessages(room.id, 1);
  if (!messages || messages.length === 0) return;

  // B. 重複排除 (Last ID check)
  const lastIdKey = `LAST_MSG_ID_${room.id}`;
  const lastMsgId = Number(PropertiesService.getScriptProperties().getProperty(lastIdKey) || 0);

  const newMessages = messages
    .filter(msg => msg.message_id > lastMsgId)
    .sort((a, b) => a.message_id - b.message_id);

  if (newMessages.length === 0) {
    console.log(`Room ${room.id}: 新着なし`);
    return;
  }

  // C. 書き込み用バッファの作成
  // 1件ずつappendすると遅いので、ある程度まとめて整形してから渡すのがコツですが、
  // DocManagerの仕様に合わせてループで書き込むか、まとめて渡すか。
  // 今回は「まとめて1つのテキスト」にしてからDocManagerに渡します。
  
  const timestamp = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm');
  let chunkText = `\n--------------------------------------------------\n`;
  chunkText += `【自動取得】 ${timestamp} (New: ${newMessages.length}件)\n\n`;

  newMessages.forEach(msg => {
    const cleaned = TextProcessor.clean(msg);
    if (cleaned && cleaned.trim().length > 0) {
      chunkText += cleaned + "\n";
    }
  });

  // D. DocManagerを使って特定の「タブ」に書き込み
  // ※注意: サイドバーで設定した「タブ名」と、実際のドキュメントの「タブ名」が一致している必要があります。
  DocManager.append(doc, room.tabName, chunkText);

  // E. ID更新
  const newestId = newMessages[newMessages.length - 1].message_id;
  PropertiesService.getScriptProperties().setProperty(lastIdKey, newestId.toString());
  
  console.log(`Room ${room.id} (${room.tabName}): 書き込み完了`);
}