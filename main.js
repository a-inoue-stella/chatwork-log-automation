/**
 * ドキュメントオープン時に実行される関数
 */
function onOpen() {
  DocumentApp.getUi()
    .createMenu('Chatwork資産化') // メニュー名
    .addItem('設定サイドバーを開く', 'showSidebar') // UiManager.gsの関数を呼ぶ
    .addItem('今すぐ手動実行', 'fetchAndStockChatwork')
    .addToUi();
}

/**
 * 定期実行されるメイン関数
 */
function fetchAndStockChatwork() {
  const TARGET_ROOMS = Config.getTargetRooms();
  const DOC_ID = Config.getDocId();

  TARGET_ROOMS.forEach(room => {
    try {
      const rawMessages = ChatworkClient.getMessages(room.id);
      if (rawMessages.length === 0) return;

      rawMessages.forEach(msg => {
        // すでに ChatworkClient 内で処理済みの本文を使用
        const processedText = msg.processedBody;
        // クレンジング後のテキストが空、あるいは改行・スペースのみの場合は処理をスキップ
        if (!processedText || processedText.trim().length === 0) {
          console.log(`空のメッセージをスキップしました (ID: ${msg.message_id})`);
          return; 
        }
        const timestamp = Utilities.formatDate(new Date(msg.send_time * 1000), "JST", "yyyy/MM/dd HH:mm");
        const senderName = msg.account.name;
        const finalContent = `[${timestamp}] ${senderName}:\n${processedText}\n`;

        DocManager.append(DOC_ID, room.tabName, finalContent);
        });
      console.log(`Room:${room.id} - ${rawMessages.length}件を処理完了`);
    } catch (e) {
      console.error(`Error in Room:${room.id} - ${e.message}`);
    }
  });
}