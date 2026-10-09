function Footer() {
    return (
        <footer className="bg-black px-[6.2%] pt-[43px] pb-6 text-white">
            {/* 上半：Logo、標語、連結 */}
            <div className="flex justify-between pb-[37px] max-[760px]:block">
                <div>
                    <img src="/img/logo.png" alt="KINU"
                         className="h-[26px] [filter:invert(1)_grayscale(1)_brightness(2)] " />
                    <div className="mt-2.5 text-[9px] tracking-[.08em] text-[#a5a09a]">EVERYDAY, BEAUTIFULLY.</div>
                </div>
                <div className="flex gap-[38px] text-[9px] tracking-[.1em] max-[760px]:mt-[30px] max-[760px]:flex-wrap max-[760px]:gap-[18px]">
                    <a href="#">配送與退貨</a>
                    <a href="#">常見問題</a>
                    <a href="/support">聯絡我們</a>
                    <a href="#">Instagram ↗</a>
                </div>
            </div>

            {/* 下半：版權 */}
            <div className="flex justify-between border-t border-[#383838] pt-[18px] text-[8px] tracking-[.1em] text-[#8b8782] max-[760px]:gap-[15px] max-[760px]:text-[7px]">
                <span>© 2026 KINU STUDIO. ALL RIGHTS RESERVED.</span>
                <span>MADE WITH CARE, IN TAIPEI.</span>
            </div>
        </footer>
    )
}
export default Footer;
