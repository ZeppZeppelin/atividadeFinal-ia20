import userImg from "../assets/userImage.png"
import imgUploadFigure from "../assets/uploadImage.png"
import chatImg from "../assets/chatImage.png"
import { useNavigate } from "react-router-dom"
export default function(){
    let navigate = useNavigate()
    return <>
    <div id="navBarBox">
        <div className="buttonBox">
            <button className="navButton" onClick={() => navigate("/Upload")}><img src={imgUploadFigure}></img></button>
        </div>
        <div className="buttonBox">
            <button className="navButton" onClick={() => navigate("/Chat")}><img src={chatImg}></img></button>
        </div>
        <div className="buttonBox">
            <button className="navButton" onClick={() => navigate("/Login")}><img src={userImg}></img></button>
        </div>
    </div>
    </>
}