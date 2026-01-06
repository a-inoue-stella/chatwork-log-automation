/**
 * Config 名前空間: システム全体の定数・設定を一括管理する
 * メンテナンス時はこのファイルのみを編集してください。
 */
const Config = (() => {

  // 1. ログを保存するGoogleドキュメントのID
  const DOC_ID = '1SGbkmm6PXOv-7EEBO-DpdKt1QrmFlQe3Rmxo6tQ8yMw';

  // 2. 取得対象のルーム設定
  // ルームを増やす場合は、この配列に要素を追加してください。
  const TARGET_ROOMS = [
    { 
      id: '418985032',       // ChatworkのルームID
      tabName: '【AX推進】デジホ事業×ステラリープ（日本PCサービス様）' // 書き込み先のタブ名
    },
    { 
      id: '419364073', 
      tabName: '【AX推進】BPO事業×ステラリープ（日本PCサービス様）'
    }
  ];

  // 3. プロパティサービス（内部管理用）のキー定義
  const PROP_KEYS = {
    CW_TOKEN: 'CHATWORK_API_TOKEN', // スクリプトプロパティに設定した名前
    LAST_ID_PREFIX: 'LAST_ID_'      // 前回取得ID保存用のプレフィックス
  };

  // 外部公開メソッド
  return {
    getDocId: () => DOC_ID,
    getTargetRooms: () => TARGET_ROOMS,
    getPropKeys: () => PROP_KEYS
  };

})();