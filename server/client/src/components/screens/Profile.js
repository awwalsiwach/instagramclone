import { useEffect, useState, useContext } from "react";
import { UserContext } from "../../App";

const Profile = () => {
    const [mypics, setPics] = useState([]);
    const { state, dispatch } = useContext(UserContext);
    const [image, setImage] = useState("");
    useEffect(() => {
        fetch('/mypost', {
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("jwt")
            }
        }).then(res => res.json())
            .then(result => {
                setPics(result.mypost);
            })
    }, [])

    useEffect(() => {
        if (image) {
            const data = new FormData();
            data.append("file", image);
            data.append("upload_preset", "instagram-clone");
            data.append("cloud_name", "da1xavmvq");
            fetch("	https://api.cloudinary.com/v1_1/da1xavmvq/image/upload", {
                method: "post",
                body: data
            })
                .then(res => res.json())
                .then(data => {
                    fetch('/updateprofilepic', {
                        method: "put",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Bearer " + localStorage.getItem("jwt")
                        },
                        body: JSON.stringify({
                            pic: data.url
                        })
                    })
                        .then(res => res.json())
                        .then(result => {
                            localStorage.setItem("user", JSON.stringify({ ...state, pic: result.pic }));
                            dispatch({ type: "UPDATEPIC", payload: result.pic });
                        })
                })
                .catch(err => {
                    console.log(err);
                })
        }
    }, [image])

    const changeProfilePic = (file) => {
        setImage(file)
    }

    return (
        <div style={{ maxWidth: "600px", margin: "0px auto" }}>
            <div style={{
                margin: "18px 0px",
                borderBottom: "1px solid grey"
            }}>
                <div style={{
                    display: "flex",
                    justifyContent: "space-around",
                }}>
                    <div>
                        <img style={{ width: "160px", height: "160px", borderRadius: "80px" }}
                            src={state ? state.pic : "Loading..."} />
                    </div>
                    <div>
                        <h4>{state ? state.name : ""}</h4>
                        <h6>{state ? state.email : ""}</h6>
                        <div style={{ display: "flex", justifyContent: "space-between", width: "108%" }}>
                            <h6>{mypics.length} posts</h6>
                            <h6>{state ? state.followers.length : ""} followers</h6>
                            <h6>{state ? state.following.length : ""} following</h6>
                        </div>
                    </div>
                </div>

                <div className="file-field input-field" style={{ margin: "10px" }} >
                    <div className="btn">
                        <span>Change Profile Pic</span>
                        <input type="file" onChange={(e) => changeProfilePic(e.target.files[0])} />
                    </div>
                    <div className="file-path-wrapper">
                        <input className="file-path validate" type="text" />
                    </div>
                </div>

            </div>
            <div className="gallery">
                {
                    mypics.map(item => {
                        return (
                            <img key={item._id} className="item" src={item.photo} alt={item.title} />
                        )
                    })
                }
            </div>
        </div >
    );
}

export default Profile;