import { Link } from 'react-router-dom'

export default function error404(){
    return (
    <div>
        <h2>404 Not Found</h2>
        <img src="/public/software/img/404 NotFound.png"/>
        <Link to="/" >参加者用に戻る</Link>
    </div>
    )
}