  
import React, { useEffect, useRef, useState } from 'react';
import Styled, { keyframes } from 'styled-components';

const Container = Styled.div`
    position: relative;
    display: inline-block;
    width: 240px;
    height: 240px;
    margin: 5px;
`;

const VideoContainer = Styled.video`
    width: 240px;
    height: 240px;
    background-color: black;
`;

interface Props {
    stream: any,
}

const Video = ({stream}: Props) => {
    const ref = useRef<HTMLVideoElement>(null);
  

    useEffect(() => {
        if (ref.current){
            ref.current.srcObject = stream;
            
        }
        
        
    })

    // return (
    //     <Container>
    //         <VideoContainer 
    //             ref={ref}
    //             controls
    //             autoPlay
    //         ></VideoContainer>
    //     </Container>
    // );

    return (
        <video
            className='user_video'
            
            autoPlay
            ref = {ref}
        >

        </video>
    )
}

export default Video;