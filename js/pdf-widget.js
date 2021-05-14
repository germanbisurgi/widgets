var PDFWidget = function (container) {
  this.container = container
  this.pdfUrl = container.getAttribute('data-pdf-url')
  this.prev = container.querySelector('.pdf-prev')
  this.next = container.querySelector('.pdf-next')
  this.canvas = container.querySelector('.pdf-canvas')
  this.context = this.canvas.getContext('2d')
  this.pdfDocument = null
  this.totalPages = 0
  this.currentPage = 0

  if (this.prev) {
    this.prev.addEventListener('click', (e) => {
      e.stopPropagation()
      if (this.currentPage !== 1) {
        this.showPage(--this.currentPage)
      }
    })
  }

  if (this.next) {
    this.next.addEventListener('click', (e) => {
      e.stopPropagation()
      if (this.currentPage !== this.totalPages) {
        this.showPage(++this.currentPage)
      }
    })
  }
}

PDFWidget.prototype.getInternetExplorerVersion = function () {
  var rv = -1
  var ua
  var re

  if (navigator.appName === 'Microsoft Internet Explorer') {
    ua = navigator.userAgent
    re = new RegExp('MSIE ([0-9]{1,}[\\.0-9]{0,})')
    if (re.exec(ua) != null) {
      rv = parseFloat(RegExp.$1)
    }
  } else if (navigator.appName === 'Netscape') {
    ua = navigator.userAgent
    re = new RegExp('Trident/.*rv:([0-9]{1,}[\\.0-9]{0,})')
    if (re.exec(ua) != null) {
      rv = parseFloat(RegExp.$1)
    }
  }

  return rv
}

PDFWidget.prototype.showPDF = async function () {
  console.log('IE version', this.getInternetExplorerVersion())

  if (this.getInternetExplorerVersion() > 0) {
    this.container.innerHTML = '<a href="' + this.pdfUrl + '">' + this.pdfUrl + '</a>'
    return
  }

  try {
    this.pdfDocument = await pdfjsLib.getDocument({ url: this.pdfUrl }).promise
  } catch (error) {
    console.error(error.message)
  }
  this.totalPages = this.pdfDocument.numPages
  this.showPage(1)
}

PDFWidget.prototype.showPage = async function (pageNumber) {
  this.currentPage = pageNumber

  // disable Previous & Next buttons while page is being loaded
  if (this.next) {
    this.next.disabled = true
  }
  if (this.prev) {
    this.prev.disabled = true
  }

  // get handle of page
  try {
    var page = await this.pdfDocument.getPage(pageNumber)
  } catch (error) {
    console.error(error.message)
  }

  // original width of the pdf page at scale 1
  var pdfOriginalWidth = page.getViewport({ scale: 1 }).width

  // as the canvas is of a fixed width we need to adjust the scale of the viewport where page is rendered
  var mod = 2

  this.canvas.width = window.innerWidth * mod
  var scaleRequired = this.canvas.width / pdfOriginalWidth

  // get viewport to render the page at required scale
  var viewport = page.getViewport({ scale: scaleRequired })

  // set canvas height same as viewport height
  this.canvas.height = viewport.height

  // page is rendered on <canvas> element
  var renderContext = {
    canvasContext: this.context,
    viewport: viewport
  }

  // render the page contents in the canvas
  try {
    await page.render(renderContext).promise
  } catch (error) {
    console.error(error.message)
  }

  if (this.next) {
    this.next.disabled = false
  }
  if (this.prev) {
    this.prev.disabled = false
  }
}
