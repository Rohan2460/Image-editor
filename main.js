import { jsPDF } from "jspdf"

const canvas = document.querySelector("#canvas")
const canvasDiv = document.querySelector("#canvasDiv")
const ctx = canvas.getContext("2d")
// Inputs
const imgWidthInput = document.querySelector("#imgWidthInput")
const imgHeightInput = document.querySelector("#imgHeightInput")
// Sliders
const aspectRatioSlider = document.querySelector("#range")
const qualitySlider = document.querySelector("#quality")

const aspectRatioLabel = document.querySelector("#range_txt")
const qualityLabel = document.querySelector("#quality_txt")

const downloadBtn = document.querySelector("#downloadBtn")
const imageSelectBtn = document.querySelector("#imgSelectBtn")

const imageType = document.querySelector("#imageType")
const downloadLink = document.querySelector("#downloadLink")
const imageContainer = document.querySelector("#imageContainer")

const widthLabel = document.querySelector("#width_label")
const heightLabel = document.querySelector("#height_label")

// Checkbox
const grayscaleBtn = document.querySelector("#grayscale")
const lockAspectRatioBtn = document.querySelector("#lockAspectRatio")

const rotateLeftBtn = document.querySelector("#btnRotateLeft")
const rotateRightBtn = document.querySelector("#btnRotateRight")

const modal = document.querySelector("#modal")

const lockAspectRatio = () => {
    return lockAspectRatioBtn.checked
}
const imageIsGrayscale = () => {
    return grayscaleBtn.checked
}

let image, imageRatio, imageName
let imageAngle = 0

// TODO: Don't scale PNG if not changed
// pdf img rotation does not work
// TODO: Move image details to top of canvas
// TODO: change height and width input to text

function imageSelector() {
    let fileInput = document.createElement("input")
    fileInput.type = "file"
    fileInput.accept = "image/*"
    fileInput.click()

    fileInput.addEventListener("change", () => {
        if (fileInput.files.length > 0) {
            const img = fileInput.files[0]
            imageName = img.name

            updateImageInfo(img.name, img.size)
            drawImageOnCanvas(img)
            modal.style.display = "none"
        }
    })
}
// DEBUG !!
// drawImageOnCanvas();
function drawImageOnCanvas(imgFile) {
    const img = new Image()
    img.src = URL.createObjectURL(imgFile)

    grayscaleBtn.checked = false
    canvas.style.filter = "grayscale(0%)"
    imageAngle = 0
    canvasDiv.style.transform = "rotate(0deg)"

    // DEBUG !!!!!!!!!!!!!!!!!
    // const img = new Image();
    // img.src = "test/hand.png";

    img.addEventListener("load", () => {
        // Set input field values, Image needs to load to get values
        image = img
        imageRatio = img.width / img.height
        imgWidthInput.value = img.width
        imgHeightInput.value = img.height

        canvas.width = image.width
        canvas.height = image.height
        ctx.drawImage(img, 0, 0)

        // Setting aspect ratio slider values
        aspectRatioSlider.setAttribute("max", image.width)
        aspectRatioSlider.setAttribute("step", image.width / 100 / 2)
        aspectRatioSlider.value = image.width

        imageType.value = imgFile.type.split("/")[1]
    })
}

function resizeImage(width, height) {
    canvas.width = width
    canvas.height = height
    ctx.drawImage(image, 0, 0, width, height)
}

function resizeBtnHandler() {
    resizeImage(imgWidthInput.value, imgHeightInput.value)
    updateImageInfo()
}

function updateImageInfo(name, size) {
    const imgName = document.querySelector("#imgName")
    const imgSize = document.querySelector("#imgSize")

    imgWidthInput.value = canvas.width
    imgHeightInput.value = canvas.height

    if (!(name || size)) {
        imgName.innerHTML = imageName
        if (imageType.value == "pdf") {
            // PDF
            imgSize.innerHTML = toKB(imageToPDF("info"))
        } else {
            // Image types
            // TODO Currently bw image size is half no real checks
            imageToBlob().then((blob) => {
                imgSize.innerHTML = toKB(blob.size)
            })
        }
    } else {
        // if args passed
        imgName.innerHTML = name
        imgSize.innerHTML = toKB(size)
    }
}

function toKB(size) {
    return (size / 1000).toFixed(2) + " KB"
}

function swapWidthHeight() {
    if (imageAngle == 90 || imageAngle == 270) {
        widthLabel.innerHTML = "Height"
        heightLabel.innerHTML = "Width"
    } else {
        widthLabel.innerHTML = "Width"
        heightLabel.innerHTML = "Height"
    }
}

function rotateImage(direction) {
    if (direction) {
        // CSS rotation
        if (direction == "right") {
            imageAngle += 90
        } else {
            imageAngle = imageAngle == 0 ? 360 : imageAngle
            imageAngle -= 90
        }
        imageAngle = Math.abs(imageAngle) == 360 ? 0 : imageAngle
        canvasDiv.style.transform = `rotate(${imageAngle}deg)`
        console.log(direction, imageAngle)
        return
        // swapWidthHeight()
    }

    let width = imgWidthInput.value
    let height = imgHeightInput.value

    // Image rotation
    if (imageAngle == 90 || imageAngle == 270) {
        canvas.width = height
        canvas.height = width
    } else {
        canvas.width = width
        canvas.height = height
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (imageAngle == 90 || imageAngle == 270) {
        ctx.translate(height / 2, width / 2)
    } else {
        ctx.translate(width / 2, height / 2)
    }
    console.log("imageAngle", imageAngle)
    ctx.rotate((imageAngle * Math.PI) / 180)
    ctx.drawImage(image, -width / 2, -height / 2, width, height)
    // swapWidthHeight()
}

function applyFilters() {
    // Grayscale
    if (!imageIsGrayscale()) {
        return
    }
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
        data[i] = avg // red
        data[i + 1] = avg // green
        data[i + 2] = avg // blue
    }

    ctx.putImageData(imageData, 0, 0)
}

// Image Conversions

function imageToBlob(type) {
    // console.log(parseFloat(qualitySlider.value), imageType.value, type)

    if (type == "pdf") {
        return canvas.toDataURL("image/jpeg", parseFloat(qualitySlider.value))
    }
    const blob = new Promise((resolve) => {
        canvas.toBlob(resolve, "image/" + imageType.value, parseFloat(qualitySlider.value))
    })

    return blob
}

function imageToPDF(mode) {
    let img_orientation = image.width > image.height ? "landscape" : "portrait"
    // if (imageAngle == 90 || imageAngle == 270) img_orientation = "landscape";
    console.log(img_orientation)

    const doc = new jsPDF({
        orientation: img_orientation,
        unit: "px",
        format: [imgWidthInput.value, imgHeightInput.value],
    })
    doc.addImage(imageToBlob("pdf"), "JPEG", 0, 0, imgWidthInput.value, imgHeightInput.value)

    if (mode == "info") {
        let pdfSize = doc.output("blob").size
        console.log(pdfSize)
        return pdfSize
    } else {
        doc.save("resized_" + imageName)
    }
}

function exportImage() {
    if (imageType.value == "pdf") {
        applyFilters()
        imageToPDF()
        return
    }
    rotateImage()
    applyFilters()

    console.log("exportImage")
    imageToBlob().then((blob) => {
        let url = URL.createObjectURL(blob)
        downloadLink.setAttribute("download", "resized_" + imageName)
        downloadLink.setAttribute("href", url)
        console.log(url)
        downloadLink.click()
    })
    resizeBtnHandler() // Hack for some unknown rotation issue
}

// Event handlers

// Main Buttons
downloadBtn.addEventListener("click", () => {
    exportImage()
})

imageSelectBtn.addEventListener("click", () => {
    imageSelector()
})

// Image dimensions input - manage aspect ratio
imgWidthInput.addEventListener("change", () => {
    imgHeightInput.value = lockAspectRatio() ? Math.floor(imgWidthInput.value / imageRatio) : imgHeightInput.value
    resizeBtnHandler()
    aspectRatioSlider.value = imgWidthInput.value // updating slider if user input
    aspectRatioSlider.dispatchEvent(new Event("input"))
})

imgHeightInput.addEventListener("change", () => {
    imgWidthInput.value = lockAspectRatio() ? Math.floor(imgHeightInput.value * imageRatio) : imgWidthInput.value
    resizeBtnHandler()
    aspectRatioSlider.value = imgWidthInput.value
    aspectRatioSlider.dispatchEvent(new Event("input"))
})

// INFO: aspectRatioSlider value = original image width
// Resolution slider - Update value label
aspectRatioSlider.addEventListener("input", () => {
    let ratio = ((aspectRatioSlider.value / image.width) * 100).toFixed(1)
    aspectRatioLabel.innerHTML = ratio + " %"
})

// Resize image
aspectRatioSlider.addEventListener("change", () => {
    resizeImage(aspectRatioSlider.value, aspectRatioSlider.value / imageRatio)
    updateImageInfo()
})

// Rotate
rotateLeftBtn.addEventListener("click", () => {
    rotateImage("left")
})
rotateRightBtn.addEventListener("click", () => {
    rotateImage("right")
})

// Quality slider
qualitySlider.addEventListener("input", () => {
    qualityLabel.innerHTML = qualitySlider.value
    updateImageInfo()
})

// Image Type
imageType.addEventListener("change", () => {
    if (imageType.value != "png") {
        qualitySlider.value = 0.8
        qualityLabel.innerHTML = "0.8"
    }
    updateImageInfo()
})

// Grayscale
grayscaleBtn.addEventListener("click", () => {
    console.log("BW ", imageIsGrayscale())
    if (imageIsGrayscale()) {
        canvas.style.filter = "grayscale(100%)"
    } else {
        canvas.style.filter = "grayscale(0%)"
    }
    updateImageInfo()
})

document.querySelector("#modalImgSelectBtn").addEventListener("click", () => {
    imageSelector()
})

window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none"
    }
}
