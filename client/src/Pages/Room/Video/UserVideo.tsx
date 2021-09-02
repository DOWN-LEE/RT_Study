import React, { useEffect, useRef } from 'react';
import MicOffIcon from '@material-ui/icons/MicOff';
import { userVideo } from '../@type/index';



import './UserVideo.css';

interface userVideoApp{
    userVideo: userVideo
}


const UserVideo = (props: userVideoApp) => {

    const ref = useRef<HTMLVideoElement>(null);
  

    useEffect(() => {
        if (ref.current){
            ref.current.srcObject = props.userVideo.stream;
        }
    },[])

    

    const isMuted = () => {
        if(props.userVideo.muted){
            return(
                <MicOffIcon color='secondary' fontSize='small'/>
            )
        }
    }

  

    return(
        <>
            <div className='user_face'>
                <video
                    className='user_video'
                    autoPlay
                    ref={ref}
                />
                <img 
                    style={{visibility: props.userVideo.videoOn? 'hidden' : 'visible'}}
                   
                    className='user_photo'
                    src='/img/person.jpg'
                />
                
            </div>
            

        
        
            <div className='user_video_info'>
                <div className='user_video_name'>
                    {props.userVideo.userName}
                    {isMuted()}
                </div>

            </div>
        
        
        
        </>
    )
}

export default UserVideo;