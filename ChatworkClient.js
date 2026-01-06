/**
 * ChatworkClient 名前空間: Chatwork APIとの通信を担う
 */
const ChatworkClient = (() => {

  /**
   * 特定のルームから新着メッセージを取得する
   * @param {string} roomId - ChatworkのルームID
   * @returns {Object[]} メッセージの配列
   */
  function getNewMessages(roomId) {
  const keys = Config.getPropKeys();
  const apiToken = PropertiesService.getScriptProperties().getProperty(keys.CW_TOKEN);
    if (!apiToken) throw new Error('CHATWORK_API_TOKEN が設定されていません。');

    // 最後に取得したメッセージIDを取得
    const lastIdKey = keys.LAST_ID_PREFIX + roomId;
    const lastId = PropertiesService.getScriptProperties().getProperty(lastIdKey) || '0';

    const url = `https://api.chatwork.com/v2/rooms/${roomId}/messages?force=0`; // force=0で新着のみ（API側仕様）
    
    const options = {
      method: 'get',
      headers: { 'X-ChatWorkToken': apiToken },
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() !== 200) {
      console.error(`APIエラー: ${response.getContentText()}`);
      return [];
    }

    const messages = JSON.parse(response.getContentText());
    
    // プロパティサービスによる二重取得防止のバックアップ（念のため）
    const newMessages = messages.filter(msg => {
      return Number(msg.message_id) > Number(lastId);
    });

    if (newMessages.length > 0) {
      // 最新のIDを保存
      const latestId = newMessages[newMessages.length - 1].message_id;
      PropertiesService.getScriptProperties().setProperty(lastIdKey, latestId);
    }

    return newMessages;
  }

  return {
    getMessages: getNewMessages
  };

})();