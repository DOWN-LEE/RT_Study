  
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
    keys: any,
    id: any
}

const Video = ({stream, keys, id}: Props) => {
    const ref = useRef<HTMLVideoElement>(null);
  

    useEffect(() => {
        if (ref.current){
            ref.current.srcObject = stream;
            
        }
        console.log("key: ",keys," id:",id);
        
    })

    return (
        <Container>
            <VideoContainer 
                ref={ref}
                controls
                autoPlay
            ></VideoContainer>
        </Container>
    );
}

export default Video;