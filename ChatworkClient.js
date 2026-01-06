/**
 * ChatworkClient 名前空間: Chatwork APIとの通信を担う
 */
const ChatworkClient = (() => {

  function getNewMessages(roomId) {
    const keys = Config.getPropKeys();
    const apiToken = PropertiesService.getScriptProperties().getProperty(keys.CW_TOKEN);
    const lastIdKey = keys.LAST_ID_PREFIX + roomId;
    const lastId = PropertiesService.getScriptProperties().getProperty(lastIdKey) || '0';

    const url = `https://api.chatwork.com/v2/rooms/${roomId}/messages?force=0`;
    const options = {
      method: 'get',
      headers: { 'X-ChatWorkToken': apiToken },
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() !== 200) return [];

    const messages = JSON.parse(response.getContentText());
    
    // 新着メッセージのみ抽出
    const newMessages = messages.filter(msg => Number(msg.message_id) > Number(lastId));

    if (newMessages.length > 0) {
      // 1. 今回の取得分から「IDと名前」の対応表を作成
      const nameMap = {};
      messages.forEach(msg => {
        nameMap[msg.account.account_id] = msg.account.name;
      });

      // 2. メッセージ本文内のIDを名前に置換する処理を TextProcessor に委ねる
      newMessages.forEach(msg => {
        // process関数の第2引数に nameMap を渡すように拡張します
        msg.processedBody = TextProcessor.process(msg.body, nameMap);
      });

      const latestId = newMessages[newMessages.length - 1].message_id;
      PropertiesService.getScriptProperties().setProperty(lastIdKey, latestId);
    }

    return newMessages;
  }

  return { getMessages: getNewMessages };
})();