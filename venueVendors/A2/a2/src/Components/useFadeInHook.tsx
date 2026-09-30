import {useEffect, useRef, useState}from "react";

function useFadeInHook() {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    //intersection observer for the fade in effect

    useEffect(() => {
        const observer = new IntersectionObserver(([entry])=> {
            if (entry.isIntersecting) setIsVisible(true);
        },     
          {threshold: 0.1}  
        );

  

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
        },[]);
        return {ref, isVisible,};
    }

    export default useFadeInHook;