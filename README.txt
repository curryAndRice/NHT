##### なにこれぇ? #####
・小山高専の工陵祭用のクイズ表示プログラム。
・全11問の、「漢字でGO」を意識した、クイズ表示&運営用ソフト。
・React, TypeScriptで構成。
・ちゃっぴーに9割書かせました。NHT_design.txtに、一番最初のプロンプトが載ってる。
・詳細はNHT_design.txtを参照のこと

##### どうやって実行するの? #####
1. node.js をインストール
https://nodejs.org/ja/download
に従ってインストールする
cmd上でnpm -v が実行出来たら成功。
2. cmd上で、hogehoge/NHT 上に移動(例のcdコマンドで)
3. npm ci を実行
画面が、cmd上で
added 123 packages, and audited 124 packages in 10s

10 packages are looking for funding
  run `npm fund` for details

1 low severity vulnerability

To address all issues, run:
  npm audit fix

Run `npm audit` for details.
のようになることを確認。


4. npm run dev を実行
画面が、cmd上で
  VITE v7.1.4  ready in 406 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
のように変わることを確認
（環境によって多少数字は変わるかも）
（だいぶ違うようならどっかでエラーかも）
5. o コマンドを実行 
oコマンドで http://localhost:5173/ みたいなリンクがプラウザで開かれる
もしくは、 上記に書かれている　http://localhost:5173/ を手動で、プラウザで開く
6. /adminに移動
ブラウザ上のアドレスバーに移動、
http://localhost:5173/
を以下のように書き換える:
http://localhost:5173/admin
管理者用なんちゃらみたいな画面になる
7. 参加者用Document を別タブで開く をクリック
管理者用画面の一番下にある

これでok
二回目以降実行するときは、4. npm run dev のところから実行する。

##### 操作方法分かりづらすぎてホバーランランルーなんだけど。#####
lキーで次に進む
[1qaz] [2wsx] [3edc] [4rfv] [5tgb]キーが、それぞれの参加者に割り当てられたボタン
参加者は、管理者用画面でキーを押すものとする
問題出題画面において、ボタン4つを全部同時押しでヒント表示