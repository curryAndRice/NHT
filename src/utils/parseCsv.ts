
import Papa from 'papaparse'
import { z } from 'zod'

const QuestionCsvSchema = z.object({
  '問題番号': z.string().transform((s) => Number(s)),
  '問題': z.string().optional().or(z.literal('')).default(''),
  '答え': z.string().optional().or(z.literal('')).default(''),
  'ヒント': z.string().optional().default(''),
  '選択肢１': z.string().optional().default(''),
  '選択肢２': z.string().optional().default(''),
  '選択肢３': z.string().optional().default(''),
  '選択肢４': z.string().optional().default(''),
  '何問目用': z.string().optional().default(''),
  '解説': z.string().optional().default(''),
  '資料リンク': z.string().optional().default(''),
  '制作者': z.string().optional().default(''),
})

type RawRow = z.infer<typeof QuestionCsvSchema>

export type Question = {
  id: number
  question: string
  answer: number | null
  hint: string
  options: string[]
  target: string
  explanation: string
  links: string[]
  author: string
}

export function parseCsvText(csvText: string): { questions: Question[]; errors: string[] } {
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  })
  const rows = parsed.data as any[]
  const errors: string[] = []
  const questions: Question[] = []
  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i]
    const r = QuestionCsvSchema.safeParse(raw)
    if (!r.success) {
      errors.push(`行 ${i + 2}: ${JSON.stringify(r.error.format())}`)
      continue
    }
    const row = r.data as RawRow
    if (!row['問題'] || row['問題'].trim() === '') continue
    const id = Number(row['問題番号'])
    const answerVal = row['答え'] ? Number(row['答え']) : NaN
    const answer = Number.isInteger(answerVal) ? answerVal : null
    const options = [row['選択肢１'] || '', row['選択肢２'] || '', row['選択肢３'] || '', row['選択肢４'] || '']
    const links = (row['資料リンク'] || '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
    questions.push({
      id: isNaN(id) ? Date.now() : id,
      question: row['問題'],
      answer,
      hint: row['ヒント'] || '',
      options,
      target: row['何問目用'] || '',
      explanation: row['解説'] || '',
      links,
      author: row['制作者'] || '',
    })
  }
  return { questions, errors }
}
const csvPath = "http://localhost:5173/public/default.csv"
export const dummyCsv = `問題番号,問題,答え,ヒント,選択肢１,選択肢２,選択肢３,選択肢４,何問目用,解説,資料リンク,制作者
1,1+1,2,指を数えてみて,1,2,3,a+bj,1〜5問目用,これは例題です。,,床井
2,都道府県名と都道府県庁所在地が一致しない都道府県の数は？,3,県の数は17,23,13,18,21,6〜9問目用,"・北海道 － 札幌市
・沖縄県 －那覇市",,小松
3,ろくじのゆうはんにふさわしいものはどれ?,1,答えのものは給食でも人気,カレーライス,小松菜のおひたし,酢豚,オムライス,1〜5問目用,「6字」の夕飯だから,,赤間
4,鯨が怒った時、変化する部位はどれ?,2,〈答〉鯨を立てる、ということわざがある,耳,目,口,ヒレ,6〜9問目用,目くじらを立てる、ということわざの語源となった（ちなみにコナンの博士クイズから出題）,,赤間
5,3+6+9+12+ ... +99 というように、初め3で、3ずつ増えていき、99で終わる数たちの合計は?,2,"1からnまでの整数の合計(1+2+…+(n-1)+n)は, n(n+1)÷2です。",1632,1683,1700,1734,6〜9問目用,"1+2+3+…+32+33は, 33*(33+1)/2 = 561 　よって、これを3倍すると3+6+9+…+96+99 = 1683",,赤間
6,"午前11時55分のとき、時計の長針と短針の間の角度は何度でしょう？　
（ただし「時刻を読むときの短針の位置」を正しく考えること。）",1,11時の向きを基準に考えるのがコツ,55/2[°],85/3[°],32.5[°],25[°],10問目用,"長針は、11時の方をそのまま指している  
短針は、11時の向きから(55/60)*30°時計回りにずれている  
よって、ずれは（60と30で約分して） 55/2°",,赤間
7,"b,nを自然数とする。n(b+11) = 7b+5である、という条件を満たすとき、bの取りうる値の合計は?",3,nは、bを1か所にのみ用いて表すことができる。式を丁寧に紐どけば解ける問題。（ちなみに作問者はAIに解を聞いちゃった。）goodluck!,72,104,107,この中に正しい解は存在しない。,全問正解者用,"n=(7b+5)/(b+11)=(​7b+77-72)/(b+11)=7-72/(b+11)
だから、nが整数となるためには72/(b+11)が整数でなければならないので、(b+11)は72の約数。　　
また、b>=1 より, (b+11)>=12。なので、
12,18,24,36,72が(b+11)のとりうる全ての値である。従って　
(bの総和)=1+7+13+25+61=107 ※AIME2025の一部改題",https://artofproblemsolving.com/wiki/index.php/2025_AIME_I_Problems/Problem_1,赤間
8,"ソーラーパネルとスピーカーを電気的に正しく繋げた装置があります。
蛍光灯の光をソーラーパネルに当てると、スピーカーはどうなるでしょう?
ただし、蛍光灯は日本の一般の御家庭用コンセントで動いていて、常に気温25℃に保たれた暗室内で実験されているものとします。",1,東日本のコンセントの周波数は、50Hzです。ちなみに、化学のk山先生の話し声はだいたい400Hz,「ブーン」という低い音が鳴る,「キーン」と高い音が鳴る,何も起きない,25℃より冷たくなる,10問目用,"日本のコンセントは、東日本で50Hz, 西日本で60Hzの周波数を持っています。
つまり、0V→+141V→0V→-141V→0V→…を1回として、電圧を1秒間で50~60回変化させています。
実はヒトの目には見えないけれど、蛍光灯は電圧が+側と-側の時のみ光っていているので、100~120Hzの周波数で光っています。
だから、その光を変換した電気のもとに動くスピーカーは「ブーン」という低い音を鳴らすんです。
ちなみに、温度に関してはむしろ25℃より上がるので不適切です。（興味がわいた人へ:実験のリンク貼っとくので見ると面白いです。）",https://site.ngk.co.jp/lab/no209/,赤間
9,"テーブルを湿った布巾で拭き、プラ下敷きをこすっておきます。
メラニンスポンジをテーブルの上に置き、そのあとプラ下敷きを近づけると、
メラニンスポンジはどのように動くでしょうか?",3,静電気の働きで、スポンジは最初下敷きに近づきます。,下敷きから反発して、机にくっつく,下敷きに近づいて、下敷きにくっつく,下敷きと机に近づいたり反発したり、という動きを繰り返し、最後は机にくっつく,下敷きと机に近づいたり反発したり、という動きを繰り返し、最後は下敷きにくっつく,10問目用,"最初、机は中性で、下敷きはマイナスの静電気を帯びます。
そのため、メラニンスポンジは静電気の働きで下敷きに近づきます。
スポンジと下敷きの静電気の差がなくなると、今度は机の方に落ちて、マイナスの静電気を湿っている机に伝えます。
机の静電気はそのまま地面から地球に流れ、メラニンスポンジも静電気を失うので、再び下敷きに近づく…
ということを十分な回数繰り返したのち、下敷きの静電気がなくなると机に止まった状態になります。",https://site.ngk.co.jp/lab/no231/,赤間`