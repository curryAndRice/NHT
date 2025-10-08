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


4. run.batを実行
初回実行時はなんか404エラー出ることがあるので、そんときはもう一回実行してださい。(脳筋)

##### 操作方法分かりづらすぎてホバーランランルーなんだけど。#####
lキーで次に進む
[1qaz] [2wsx] [3edc] [4rfv] [5tgb]キーが、それぞれの参加者に割り当てられたボタン
参加者は、管理者用画面でキーを押すものとする
管理者用画面において、画面上のヒントボタン押すとヒント表示(他の人は変更できなくなるので注意)