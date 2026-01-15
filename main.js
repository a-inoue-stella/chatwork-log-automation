/**
 * ドキュメントオープン時に実行される関数
 */
function onOpen() {
  DocumentApp.getUi()
    .createMenu('Chatwork資産化')
    .addItem('設定サイドバーを開く', 'showSidebar') // UiManager.gsの関数
    .addItem('今すぐ手動実行', 'fetchAndStockChatwork')
    .addToUi();
}

/**
 * メイン関数: 定期実行トリガーまたは手動実行から呼ばれる
 */
function fetchAndStockChatwork() {
  // 1. 設定の読み込み (サイドバーで保存された値)
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('CHATWORK_API_TOKEN');
  const roomsJson = props.getProperty('TARGET_ROOMS_CONFIG');
  
  // 設定未完了時のガード
  if (!token || !roomsJson) {
    console.warn('設定が完了していません。サイドバーからAPIトークンと監視ルームを設定してください。');
    return;
  }
  
  const rooms = JSON.parse(roomsJson);
  const doc = DocumentApp.getActiveDocument(); // 処理対象のドキュメントを取得

  // 2. ルームごとに処理を実行
  rooms.forEach(room => {
    try {
      processRoomLog(token, room, doc);
    } catch (e) {
      // エラー発生時: コンソールとログシートの両方に記録
      console.error(`Error in Room ${room.id} (${room.tabName}): ${e.message}`);
      LogManager.error(room.id, room.tabName, e);
    }
  });
}

/**
 * 個別ルームの処理ロジック
 * force=1(最新100件)で取得し、前回IDと比較して差分のみを追記する
 */
function processRoomLog(token, room, doc) {
  const client = new ChatworkClient(token);
  
  // A. Chatworkから最新100件を強制取得 (force=1)
  // ※既読状態に依存せず、確実に取りこぼしを防ぐため
  const messages = client.fetchMessages(room.id, 1);
  if (!messages || messages.length === 0) return;

  // B. 前回保存した最後のメッセージIDを取得
  const lastIdKey = `LAST_MSG_ID_${room.id}`;
  const lastMsgId = Number(PropertiesService.getScriptProperties().getProperty(lastIdKey) || 0);

  // C. フィルタリング & ソート
  // APIは「新しい順」で返すが、ログは「古い順」に書きたい & 重複を排除したい
  const newMessages = messages
    .filter(msg => Number(msg.message_id) > lastMsgId) // 新着のみ抽出
    .sort((a, b) => Number(a.message_id) - Number(b.message_id)); // 古い順に並び替え

  // 新着がなければここで終了（ログシートは汚さない）
  if (newMessages.length === 0) {
    return;
  }

  // D. 書き込み用バッファの作成
  const timestamp = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm');
  let chunkText = `\n--------------------------------------------------\n`;
  chunkText += `【自動取得】 ${timestamp} (New: ${newMessages.length}件)\n\n`;

  newMessages.forEach(msg => {
    // TextProcessorを用いて整形・クレンジング
    const cleaned = TextProcessor.clean(msg);

    // 空メッセージチェック (本文がない場合はスキップ)
    if (cleaned && cleaned.trim().length > 0) {
      chunkText += cleaned + "\n";
    }
  });

  // E. ドキュメントへの書き込み実行
  // ※DocManager内でタブの存在確認を行う
  DocManager.append(doc, room.tabName, chunkText);

  // F. 最終IDを更新して保存
  const newestId = newMessages[newMessages.length - 1].message_id;
  PropertiesService.getScriptProperties().setProperty(lastIdKey, newestId.toString());
  
  console.log(`Room ${room.id}: ${newMessages.length}件追記完了 (New LastID: ${newestId})`);

  // ★追加: 正常に保存できた場合のみ、生存確認ログを残す
  LogManager.info(room.id, room.tabName, newMessages.length);
}