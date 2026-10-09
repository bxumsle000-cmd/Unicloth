/** 三個系列大圖 */
const LOOKS = [
    { code: 'all_women', img: '/img/look-01.png', alt: 'KINU 秋日女裝穿搭' },
    { code: 'all_men', img: '/img/look-02.png', alt: 'KINU 秋日男裝穿搭' },
    { code: 'all_kids', img: '/img/look-03.png', alt: 'KINU 秋冬衣著系列' },
];

function Home() {
    return (
        <>
        {/* 主視覺影片 */}
        <section className="relative h-[min(68vw,760px)] min-h-[540px] w-full overflow-hidden
                            max-[760px]:h-[78vh] max-[760px]:min-h-[530px]">
            <video src="/video/hero-01.mp4" poster="/img/campaign.jpg"
                   autoPlay muted loop playsInline
                   className="absolute inset-0 size-full object-cover object-[center_42%] saturate-[.73]
                              max-[760px]:object-[58%_center]" />
        </section>

        {/* 跑馬標語 */}
        <div className="flex items-center justify-center gap-[34px] px-3 py-[23px] text-[9px] tracking-[.18em] text-[#6f6963]
                        max-[760px]:flex-wrap max-[760px]:gap-3 max-[760px]:text-[7px] max-[760px]:tracking-[.08em]">
            <span>MADE FOR YOUR EVERYDAY</span>
            <i className="size-[3px] rounded-full bg-[#a9a198]"></i>
            <span>天然質地・自在生活</span>
            <i className="size-[3px] rounded-full bg-[#a9a198]"></i>
            <span>LESS, BUT BETTER</span>
        </div>

        {/* 系列大圖 */}
        <section id="collections">
            {LOOKS.map((look) => (
                <div key={look.code}
                   className="relative mb-[72px] block aspect-[2/1] w-full overflow-hidden bg-[#D9CFC7] max-[760px]:mb-12">
                    <img src={look.img} alt={look.alt} className="size-full object-cover object-[center_42%]" />
                </div>
            ))}
        </section>

        {/* 秋冬預告 */}
        <section className="relative h-[min(63vw,760px)] min-h-[510px] overflow-hidden text-white
                            max-[760px]:h-[68vh] max-[760px]:min-h-[500px]">
            <img src="/img/campaign.jpg" alt="KINU 2026 秋冬系列形象照"
                 className="size-full object-cover brightness-[.65] saturate-[.72]" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] tracking-[.25em]">COMING SOON</span>
                <h2 className="my-5 text-[clamp(36px,5vw,66px)] font-medium leading-[1.25] tracking-[.08em]">KINU 2026<br />秋冬系列</h2>
                <p className="mb-2.5 text-base tracking-[.2em]">即將販售</p>
                <strong className="text-xs font-normal tracking-[.2em]">2026.10.15</strong>
            </div>
        </section>
        </>
    )
}

export default Home;
