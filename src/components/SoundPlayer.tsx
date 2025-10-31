import React, { useEffect, useState, useRef } from 'react'
import useSound from 'use-sound';
import { revSoundMap } from '../pages/AdminPage';

export function plays(){
  const [askPlay, {stop: askStop}] = useSound('/software/sfx/出題1.mp3')
  const soundPath = '/software/sfx/';
  const soundNames = ["出題1.mp3", "和太鼓でドン.mp3", "歓声と拍手1.mp3", "風が吹く.mp3", "Explosion07-1(Dry).mp3", "チーン1.mp3"]
  let soundPlay: Function[] = []
  for (let i=0; i<soundNames.length; i++){
    const [play] = useSound(soundPath+soundNames[i])
    soundPlay.push(play)
  } 
  return {soundNames, soundPlay}
}

export default function SoundPlayer(){
  const {soundNames, soundPlay} = plays()
  let SoundPlayer : JSX.Element[] = []
  SoundPlayer.push(<h3 key='title' className='sound'>SoundPlayer</h3>)
  for (let i=0; i<soundPlay.length; i++){
    
    SoundPlayer.push(
    <button key={i} onClick={() => soundPlay[i]()}>
      {soundNames[i]}
      <span className='--tutorial-key'>{revSoundMap[i]}</span>
    </button>)
  }
  return SoundPlayer
}