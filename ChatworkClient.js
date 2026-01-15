/**
 * ChatworkClient クラス
 * APIとの通信のみを担当し、ロジック（重複判定や保存）は持たない設計とする
 */
class ChatworkClient {
  /**
   * @param {string} token - Chatwork APIトークン
   */
  constructor(token) {
    this.token = token;
    this.baseUrl = 'https://api.chatwork.com/v2';
  }

  /**
   * ルームのメッセージを取得する
   * @param {string} roomId - ルームID
   * @param {number} force - 0:未読のみ, 1:最新100件(推奨)
   * @returns {Array} メッセージオブジェクトの配列
   */
  fetchMessages(roomId, force = 1) {
    // 【変更点】
    // 既存コードは force=0（未読のみ）でしたが、人間が既読をつけると
    // ログが取れなくなるリスクがあるため、force=1（最新100件）を標準とします。
    // 重複データは main.gs 側で message_id を見て弾くので安全です。

    if (!roomId) throw new Error('Room ID is required');

    const url = `${this.baseUrl}/rooms/${roomId}/messages?force=${force}`;
    
    const options = {
      method: 'get',
      headers: { 'X-ChatWorkToken': this.token },
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();

    if (code === 200) {
      const json = JSON.parse(response.getContentText());
      return json; // 生のメッセージ配列を返す
    } else if (code === 204) {
      return []; // メッセージなし(正常)
    } else {
      // エラー時は詳細をログに出してスロー
      console.error(`Chatwork API Error: ${code} RoomID: ${roomId}`);
      throw new Error(`Chatwork API Error: ${code} ${response.getContentText()}`);
    }
  }
  
  /**
   * 接続テスト用: 自分自身の情報を取得
   */
  getMe() {
    const url = `${this.baseUrl}/me`;
    const response = UrlFetchApp.fetch(url, { 
      method: 'get',
      headers: { 'X-ChatWorkToken': this.token },
      muteHttpExceptions: true
    });
    return JSON.parse(response.getContentText());
  }
}