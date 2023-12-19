

export function GetDetectMobile() {
    const DETECT = new MobileDetect(window.navigator.userAgent);

    // console.log(DETECT.phone(), 'pdetect')
    // console.log(DETECT.mobile(), 'mdetect')
    // console.log(DETECT.tablet(), 'tdetect')

    return { mobile: DETECT.mobile(), tablet: DETECT.tablet() }
}

