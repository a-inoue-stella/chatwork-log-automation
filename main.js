/**
 * 定期実行されるメイン関数
 */
function fetchAndStockChatwork() {
  // 設定情報（Config.gsに切り出しても良い）
  const TARGET_ROOMS = [
    { id: '418985032', tabName: '【AX推進】デジホ事業×ステラリープ（日本PCサービス様）' },
    { id: '419364073', tabName: '【AX推進】BPO事業×ステラリープ（日本PCサービス様）' }
  ];
  const DOC_ID = '1SGbkmm6PXOv-7EEBO-DpdKt1QrmFlQe3Rmxo6tQ8yMw';

  TARGET_ROOMS.forEach(room => {
    try {
      // 1. メッセージ取得
      const rawMessages = ChatworkClient.getMessages(room.id);
      if (rawMessages.length === 0) return;

      rawMessages.forEach(msg => {
        // 2. テキスト処理（クレンジング & 構造化）
        const processedText = TextProcessor.process(msg.body);
        
        // 3. フォーマット整形
        const timestamp = Utilities.formatDate(new Date(msg.send_time * 1000), "JST", "yyyy/MM/dd HH:mm");
        const senderName = msg.account.name;
        const finalContent = `[${timestamp}] ${senderName}:\n${processedText}\n`;

        // 4. ドキュメントへの追記
        DocManager.append(DOC_ID, room.tabName, finalContent);
      });
      
      console.log(`ルームID:${room.id} から ${rawMessages.length} 件を蓄積しました。`);

    } catch (e) {
      console.error(`ルームID:${room.id} の処理中にエラーが発生しました: ${e.message}`);
    }
  });
}