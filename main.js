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