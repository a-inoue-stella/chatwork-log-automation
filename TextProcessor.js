/**
 * TextProcessor 名前空間: Chatworkメッセージのクレンジングと構造化を担う
 */
const TextProcessor = (() => {

  /**
   * Chatworkの独自タグをサニタイズし、TO通知をプレーンテキストで構造化するメイン関数
   * @param {string} body - Chatworkから取得した生のメッセージ本文
   * @returns {string} 整形済みのメッセージ本文
   */
  function processMessage(body) {
    if (!body) return "";

    let processedBody = body;

    // 1. TO通知の構造化 [To:xxxx] 氏名さん -> 【TO: 氏名様】
    // タグ直後の「氏名さん」や「氏名様」などの呼称を活かしつつ、明文化します
    processedBody = processedBody.replace(/\[To:\d+\]\s*([^\s]+)/g, '【TO: $1様】');

    // 2. [info][title]...[/info] タグの変換
    // 枠組みを外し、中身を強調形式に変更します
    processedBody = processedBody.replace(/\[info\]([\s\S]*?)\[\/info\]/g, '$1');
    processedBody = processedBody.replace(/\[title\]([\s\S]*?)\[\/title\]/g, '【 $1 】');

    // 3. [qt]...[/qt] 引用タグの変換
    // 一般的な引用符（> ）に変換し、可読性を高めます
    processedBody = processedBody.replace(/\[qt\]([\s\S]*?)\[\/qt\]/g, (match, p1) => {
      return p1.split('\n').map(line => `> (引用): ${line}`).join('\n');
    });

    // 4. [hr] 横線の置換
    processedBody = processedBody.replace(/\[hr\]/g, '----------------------------------------');

    // 5. 不要なノイズタグ（picon, preview等）の一括削除
    // 属性情報やプレビューリンクなどはドキュメントの可読性を損なうため除去します
    processedBody = processedBody.replace(/\[picon:\d+\]|\[preview id=\d+\]|\[rp aid=\d+ to=\d+-\d+\]/g, '');

    // 6. 前後の余計な空行を整理
    return processedBody.trim();
  }

  // 外部に公開するメソッド
  return {
    process: processMessage
  };

})();