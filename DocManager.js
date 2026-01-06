/**
 * DocManager 名前空間: Googleドキュメントのタブ操作を担う
 */
const DocManager = (() => {

  /**
   * 指定した名前のタブにテキストを追記する
   * @param {string} docId - 対象ドキュメントのID
   * @param {string} tabName - 追記対象のタブ名（ルーム名）
   * @param {string} text - 追記する整形済みテキスト
   */
  function appendTextToTab(docId, tabName, text) {
    const doc = DocumentApp.openById(docId);
    const tabs = doc.getTabs();
    
    // タブを再帰的に探索して対象を見つける
    const targetTab = findTabByName(tabs, tabName);

    if (!targetTab) {
      console.warn(`タブが見つかりません: ${tabName}`);
      // 運用上のエラーとしてログを残すなどの処理が必要
      return;
    }

    // TabオブジェクトをDocumentTabに変換してBodyを取得
    const docTab = targetTab.asDocumentTab();
    const body = docTab.getBody();

    // 末尾に追記
    body.appendParagraph(text);
  }

  /**
   * タブのリストから名前が一致するものを再帰的に探索する
   * @param {Tab[]} tabs - 探索対象のタブ配列
   * @param {string} name - 探したいタブ名
   * @returns {Tab|null} 見つかったタブ、なければnull
   */
  function findTabByName(tabs, name) {
    for (const tab of tabs) {
      if (tab.getTitle() === name) {
        return tab;
      }
      // 子タブがある場合は再帰的に探索（リファレンスの階層構造に対応）
      const childTabs = tab.getChildTabs();
      if (childTabs.length > 0) {
        const found = findTabByName(childTabs, name);
        if (found) return found;
      }
    }
    return null;
  }

  return {
    append: appendTextToTab
  };

})();