    // 主視覺影片輪播：‹ › 切換，影片播完自動換下一支
    const heroSlides = ['video/hero-01.mp4', 'video/hero-02.mp4', 'video/hero-03.mp4'];
    let heroSlide = 0;

    function changeSlide(step) {
        const next = heroSlide + step;
        if (next < 0 || next >= heroSlides.length) return;
        heroSlide = next;
        const video = document.getElementById('heroVideo');
        video.src = heroSlides[heroSlide];
        video.load();
        video.play().catch(() => {});
        document.getElementById('slideCount').textContent = '0' + (heroSlide + 1) + '　/　0' + heroSlides.length;
        document.getElementById('slideDots').textContent = heroSlides.map((_, i) => i === heroSlide ? '●' : '○').join('　');
    }

    document.getElementById('heroVideo').addEventListener('ended', () => changeSlide(1));
