/**
 * LogManager: ログをスプレッドシートに記録する
 */
const LogManager = (() => {
  
  // 共通の書き込み処理
  function writeToSheet(type, roomId, tabName, message, detail = '') {
    const props = PropertiesService.getScriptProperties();
    const sheetId = props.getProperty('LOG_SHEET_ID');

    if (!sheetId) return; // ID未設定なら何もしない

    try {
      const ss = SpreadsheetApp.openById(sheetId);
      const sheet = ss.getSheets()[0];
      const timestamp = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');
      
      // フォーマット: [日時, ログ種別, ルームID, タブ名, メッセージ, 詳細]
      sheet.appendRow([timestamp, type, roomId, tabName, message, detail]);

    } catch (e) {
      console.error('ログ書き込み失敗: ' + e.message);
    }
  }

  return {
    // エラー用: 赤字にしたいため、運用で条件付き書式などを設定すると良い
    error: (roomId, tabName, error) => {
      writeToSheet('ERROR', roomId, tabName, error.message, error.stack);
    },
    
    // 正常処理用（書き込み成功時のみ使用）
    info: (roomId, tabName, count) => {
      writeToSheet('INFO', roomId, tabName, `${count}件保存完了`, '-');
    }
  };

})();