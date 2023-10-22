

export function GetDetectMobile() {
    const DETECT = new MobileDetect(window.navigator.userAgent);
    return DETECT.mobile()
}

