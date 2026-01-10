const themeToggle = document.getElementById("themeToggle")
const themeIcon = document.getElementById("themeIcon")
const html = document.documentElement

const savedTheme = localStorage.getItem("theme") || "light"
html.setAttribute("data-theme", savedTheme)
themeIcon.textContent = savedTheme === "dark" ? "☀️" : "🌙"

themeToggle.addEventListener("click", () => {
    const currentTheme = html.getAttribute("data-theme")
    const newTheme = currentTheme === "light" ? "dark" : "light"

    html.setAttribute("data-theme", newTheme)
    localStorage.setItem("theme", newTheme)
    themeIcon.textContent = newTheme === "dark" ? "☀️" : "🌙"
})

let player = null
let currentVideoUrl = ""

const Plyr = window.Plyr

function initializePlayer() {
    const videoElement = document.getElementById("player")
    player = new Plyr(videoElement, {
        controls: [
            "play-large",
            "play",
            "progress",
            "current-time",
            "duration",
            "mute",
            "volume",
            "settings",
            "fullscreen",
        ],
        autoplay: true,
        hideControls: false,
    })

    player.on("ready", () => {
        hideLoading()
    })

    player.on("error", () => {
        showError()
    })
}

function showPlaceholder() {
    document.getElementById("playerPlaceholder").classList.remove("hidden")
    document.getElementById("loadingState").classList.remove("active")
    document.getElementById("errorState").classList.remove("active")
}

function showLoading() {
    document.getElementById("playerPlaceholder").classList.add("hidden")
    document.getElementById("loadingState").classList.add("active")
    document.getElementById("errorState").classList.remove("active")
    document.getElementById("player").style.display = "none"
}

function showPlayer() {
    document.getElementById("playerPlaceholder").classList.add("hidden")
    document.getElementById("loadingState").classList.remove("active")
    document.getElementById("errorState").classList.remove("active")
    document.getElementById("player").style.display = "block"
}

function showError() {
    document.getElementById("playerPlaceholder").classList.add("hidden")
    document.getElementById("loadingState").classList.remove("active")
    document.getElementById("errorState").classList.add("active")
    document.getElementById("player").style.display = "none"
}

function hideLoading() {
    document.getElementById("loadingState").classList.remove("active")
}

function enableActionButtons() {
    document.getElementById("downloadBtn").disabled = false
    document.getElementById("vlcBtn").disabled = false
    document.getElementById("shareVideoBtn").disabled = false
}

function disableActionButtons() {
    document.getElementById("downloadBtn").disabled = true
    document.getElementById("vlcBtn").disabled = true
    document.getElementById("shareVideoBtn").disabled = true
}

function isValidUrl(string) {
    try {
        const url = new URL(string)
        return url.protocol === "http:" || url.protocol === "https:"
    } catch (_) {
        return false
    }
}

document.getElementById("loadBtn").addEventListener("click", loadVideo)
document.getElementById("videoUrl").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        loadVideo()
    }
})

function loadVideo() {
    const urlInput = document.getElementById("videoUrl")
    const errorMessage = document.getElementById("urlError")
    const url = urlInput.value.trim()

    errorMessage.textContent = ""

    if (!url) {
        errorMessage.textContent = "Please enter a video URL"
        return
    }

    if (!isValidUrl(url)) {
        errorMessage.textContent = "Please enter a valid URL (must start with http:// or https://)"
        return
    }

    currentVideoUrl = url
    updateUrlParameter(url)

    showLoading()

    if (!player) {
        initializePlayer()
    }

    const videoType = getVideoType(url)

    const videoElement = document.getElementById("player")
    const sourceElement = document.getElementById("videoSource")

    sourceElement.src = url
    sourceElement.type = videoType

    videoElement.load()

    enableActionButtons()

    setTimeout(() => {
        showPlayer()
        if (player && player.play) {
            player.play().catch((err) => {
                console.log("Play error:", err)
            })
        }
    }, 1000)
}

function getVideoType(url) {
    const urlLower = url.toLowerCase()
    if (urlLower.includes(".webm")) {
        return "video/webm"
    } else if (urlLower.includes(".m3u8")) {
        return "application/x-mpegURL"
    } else {
        return "video/mp4"
    }
}

function updateUrlParameter(videoUrl) {
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set("v", videoUrl)
    window.history.pushState({}, "", newUrl)
}

function loadVideoFromUrl() {
    const urlParams = new URLSearchParams(window.location.search)
    const videoUrl = urlParams.get("v")

    if (videoUrl && isValidUrl(videoUrl)) {
        document.getElementById("videoUrl").value = videoUrl
        loadVideo()
    }
}

document.getElementById("downloadBtn").addEventListener("click", () => {
    if (!currentVideoUrl) return

    const link = document.createElement("a")
    link.href = currentVideoUrl
    link.download = "video"
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showToast("Download started!")
})

document.getElementById("vlcBtn").addEventListener("click", () => {
    if (!currentVideoUrl) return

    const vlcUrl = `vlc://${currentVideoUrl}`
    window.location.href = vlcUrl

    setTimeout(() => {
        openVlcModal()
    }, 1000)
})

document.getElementById("shareBtn").addEventListener("click", () => {
    openShareModal()
})

const shareModal = document.getElementById("shareModal")
const closeModalBtn = document.getElementById("closeModal")

function openShareModal() {
    shareModal.classList.add("active")
    shareModal.setAttribute("aria-hidden", "false")
}

function closeShareModal() {
    shareModal.classList.remove("active")
    shareModal.setAttribute("aria-hidden", "true")
}

closeModalBtn.addEventListener("click", closeShareModal)

shareModal.addEventListener("click", (e) => {
    if (e.target === shareModal) {
        closeShareModal()
    }
})

document.getElementById("shareWebsiteBtn").addEventListener("click", async () => {
    const websiteUrl = window.location.origin

    if (navigator.share) {
        try {
            await navigator.share({
                title: "The Wizard - Online Video Player",
                text: "Check out this online video player!",
                url: websiteUrl,
            })
            closeShareModal()
        } catch (err) {
            if (err.name !== "AbortError") {
                copyToClipboard(websiteUrl)
            }
        }
    } else {
        copyToClipboard(websiteUrl)
    }
})

document.getElementById("shareVideoBtn").addEventListener("click", async () => {
    if (!currentVideoUrl) return

    const shareUrl = `${window.location.origin}${window.location.pathname}?v=${encodeURIComponent(currentVideoUrl)}`

    if (navigator.share) {
        try {
            await navigator.share({
                title: "Watch this video on The Wizard",
                text: "Check out this video!",
                url: shareUrl,
            })
            closeShareModal()
        } catch (err) {
            if (err.name !== "AbortError") {
                copyToClipboard(shareUrl)
            }
        }
    } else {
        copyToClipboard(shareUrl)
    }
})

const vlcModal = document.getElementById("vlcModal")
const closeVlcModalBtn = document.getElementById("closeVlcModal")

function openVlcModal() {
    vlcModal.classList.add("active")
    vlcModal.setAttribute("aria-hidden", "false")
}

function closeVlcModal() {
    vlcModal.classList.remove("active")
    vlcModal.setAttribute("aria-hidden", "true")
}

closeVlcModalBtn.addEventListener("click", closeVlcModal)

vlcModal.addEventListener("click", (e) => {
    if (e.target === vlcModal) {
        closeVlcModal()
    }
})

document.getElementById("copyVlcBtn").addEventListener("click", () => {
    if (!currentVideoUrl) return

    copyToClipboard(currentVideoUrl)
    closeVlcModal()
})

function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
            .writeText(text)
            .then(() => {
                showToast("Link copied to clipboard!")
            })
            .catch(() => {
                fallbackCopy(text)
            })
    } else {
        fallbackCopy(text)
    }
}

function fallbackCopy(text) {
    const textarea = document.createElement("textarea")
    textarea.value = text
    textarea.style.position = "fixed"
    textarea.style.opacity = "0"
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()

    try {
        document.execCommand("copy")
        showToast("Link copied to clipboard!")
    } catch (err) {
        showToast("Failed to copy link")
    }

    document.body.removeChild(textarea)
}

function showToast(message) {
    const toast = document.getElementById("toast")
    toast.textContent = message
    toast.classList.add("show")

    setTimeout(() => {
        toast.classList.remove("show")
    }, 3000)
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        if (shareModal.classList.contains("active")) {
            closeShareModal()
        }
        if (vlcModal.classList.contains("active")) {
            closeVlcModal()
        }
    }
})

document.addEventListener("DOMContentLoaded", () => {
    showPlaceholder()
    disableActionButtons()
    loadVideoFromUrl()
})