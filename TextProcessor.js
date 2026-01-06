/**
 * TextProcessor 名前空間: Chatworkメッセージのクレンジングと構造化を担う
 */
const TextProcessor = (() => {

  /**
   * Chatworkの独自タグをサニタイズし、可読性を最大化したテキストを返す
   * @param {string} body - Chatworkから取得した生のメッセージ本文
   * @returns {string} 整形済みのメッセージ本文
   */
  function processMessage(body) {
    if (!body) return "";

    let processedBody = body;

    // 1. TO通知の構造化：[To:xxxx] 氏名さん -> 【TO: 氏名さん】
    // Chatworkデフォルトの「さん」を活かし、追加の敬称は付与しない
    processedBody = processedBody.replace(/\[To:\d+\]\s*/g, '【TO: 】');

    // 2. [info]タグ：前後に改行を入れて独立したブロックにする
    processedBody = processedBody.replace(/\[info\]([\s\S]*?)\[\/info\]/g, '\n$1\n');

    // 3. [title]タグ：見出しとして強調し、直後に改行を挿入
    processedBody = processedBody.replace(/\[title\]([\s\S]*?)\[\/title\]/g, '【 $1 】\n');

    // 4. [qt]タグ：引用形式へ変換
    processedBody = processedBody.replace(/\[qt\]([\s\S]*?)\[\/qt\]/g, (match, p1) => {
      return '\n' + p1.split('\n').map(line => `> (引用): ${line}`).join('\n') + '\n';
    });

    // 5. [hr]タグ：区切り線の前後に改行を挿入
    processedBody = processedBody.replace(/\[hr\]/g, '\n----------------------------------------\n');

    // 6. ノイズタグ（picon, preview等）の削除
    processedBody = processedBody.replace(/\[picon:\d+\]|\[preview id=\d+\]|\[rp aid=\d+ to=\d+-\d+\]/g, '');

    // 7. 仕上げ：3行以上の連続改行を2行（1行空き）に集約し、前後の空白を削除
    return processedBody.replace(/\n{3,}/g, '\n\n').trim();
  }

  return {
    process: processMessage
  };

})();