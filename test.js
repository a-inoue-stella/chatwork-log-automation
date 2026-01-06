function testTextProcessor() {
  const rawMsg = "[To:12345] 中條さん\n[info][title]打ち合わせ結果[/title]本日はありがとうございました。[hr]次回は来週です。[/info]\n[qt]承知いたしました。[/qt]";
  const result = TextProcessor.process(rawMsg);
  console.log(result);
}

function testDocManager() {
  const docId = "あなたのドキュメントID"; // 実際のIDに書き換えてください
  const tabName = "テスト用タブ名"; // 手動で作ったタブ名
  DocManager.append(docId, tabName, "これはDocManagerからのテスト投稿です。");
}