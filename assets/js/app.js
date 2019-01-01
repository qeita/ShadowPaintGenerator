(() => {

  new Vue({
    el: '#app',
    data() {
      return {
        currentMode: 'paint',
        draw: {
          isDown:   false,
          type:     1,        // 1: pen, 0: eraser, 2: dropper
          color:    '#000000'
        },
        cell: {
          col:  10,
          row:  10,
          size: 10
        },
        styles: {
          boxShadow:  '',
          color:      ''
        }
      }
    },
    watch: {
      'cell.col'(a, b) {
        setTimeout( () => {
          this.drawGuide()
        }, 300)
      },
      'cell.row'(a, b) {
        setTimeout( () => {
          this.drawGuide()
        }, 300)
      },
      'cell.size'(a, b) {
        setTimeout( () => {
          this.drawGuide()
        }, 300)
      }
    },
    computed: {
      canvasStyle() {
        return {
          width: `${this.cell.col * this.cell.size}px`,
          height: `${this.cell.row * this.cell.size}px`
        }
      },
      previewBoxStyle() {
        return {
          width: `${this.cell.col * this.cell.size}px`,
          height: `${this.cell.row * this.cell.size}px`
        }
      },
      previewShadowStyle() {
        return {
          top: `-${this.cell.size}px`,
          left: `-${this.cell.size}px`,
          width: `${this.cell.size}px`,
          height: `${this.cell.size}px`,
          color: `${this.styles.color}`,
          boxShadow: `${this.styles.boxShadow}`
        }
      },
      textAreaText() {
        return `
          div{
            position: relative;
            width: ${this.cell.col * this.cell.size}px;
            height: ${this.cell.row * this.cell.size}px;
          }
          div:after{
            position: absolute;
            top: -${this.cell.size}px;
            left: -${this.cell.size}px;
            width: ${this.cell.size}px;
            height: ${this.cell.size}px;
            color: ${this.styles.color};
            box-shadow: ${this.styles.boxShadow};
            display: block;
            content: '';
          }
        `
      }
    },
    created() {
      this.devicePixel = window.devicePixelRatio
    },
    mounted() {
      this.canvas = this.$refs.canvas
      this.c = this.canvas.getContext('2d')
      this.guide = this.$refs.guide
      this.g = this.guide.getContext('2d')

      this.inputColor = this.$refs.color
      this.inputSize = this.$refs.size
      this.btnDownload = this.$refs.download
      this.drawGuide()
    },
    methods: {
      /**
       * 描画 / 画像アップロードの切り替え
       * @param {object} e - イベントオブジェクト 
       */
      setMode(e) {
        const mode = e.currentTarget.getAttribute('data-mode') 
        if(this.currentMode === mode) return
        this.currentMode = mode
      },
      /**
       * ペン / 消しゴム / スポイト ツールの切り替え
       */
      changeDrawType(n) {
        this.draw.type = n
        if(n === 0){
          this.c.globalCompositeOperation = 'destination-out'
        }else if(n === 1){
          this.c.globalCompositeOperation = 'source-over'
        }
      },

      /**
       * Canvasサイズ変更
       * @param {object} e - イベントオブジェクト 
       */
      updateSize(e) {
        let v = parseInt( e.currentTarget.value, 10 )
        if(v < parseInt( e.currentTarget.getAttribute('min'), 10 )){
          v = parseInt( e.currentTarget.getAttribute('min'), 10 )
        }
        if(v > parseInt( e.currentTarget.getAttribute('max'), 10 )){
          v = parseInt( e.currentTarget.getAttribute('max'), 10 )
        }
        const size = e.currentTarget.getAttribute('data-cell')
        this.cell[size] = v
      },
      /**
       * 色変更
       */
      changeColor(e) {
        this.draw.color = e.currentTarget.value
      },

      onHandleDown(e) {
        this.draw.isDown = true
        if(this.draw.type === 2){
          this.getColor(e)
        }else{
          this.drawRect(e)
        }
      },
      onHandleMove(e) {
        if(this.currentMode === 'paint' && this.draw.isDown){
          if(this.draw.type === 2){
            this.getColor(e)
          }else{
            this.drawRect(e)
          }
        }
      },
      onHandleUp() {
        this.draw.isDown = false
      },

      /**
       * RGB -> HEX
       * https://lab.syncer.jp/Web/JavaScript/Snippet/60/
       * @param {array} rgb - RGBカラーの配列情報 
       */
      rgb2hex( rgb ) {
        return "#" + rgb.map( function ( value ) {
          return ( "0" + value.toString( 16 ) ).slice( -2 )
        } ).join( "" )
      },

      /**
       * スポイトツールによる色取得
       * @param {object} e - イベントオブジェクト
       */
      getColor(e) {
        this.canvasRect = this.canvas.getBoundingClientRect()
        const _x = e.pageX - this.canvasRect.left
        const _y = e.pageY - this.canvasRect.top
        const imageData = this.c.getImageData(
          Math.floor( _x / this.cell.size ) * this.cell.size * this.devicePixel,
          Math.floor( _y / this.cell.size ) * this.cell.size * this.devicePixel,
          1,
          1
        )
        let data = imageData.data
        this.draw.color = this.rgb2hex([ data[0], data[1], data[2] ])
      },

      /**
       * 色描画
       * @param {object} e - イベントオブジェクト
       */
      drawRect(e) {
        this.canvasRect = this.canvas.getBoundingClientRect()
        this.c.fillStyle = this.draw.color
        const _x = e.pageX - this.canvasRect.left
        const _y = e.pageY - this.canvasRect.top

        this.c.fillRect(
          Math.floor( _x / this.cell.size ) * this.cell.size * this.devicePixel,
          Math.floor( _y / this.cell.size ) * this.cell.size * this.devicePixel,
          this.cell.size * this.devicePixel,
          this.cell.size * this.devicePixel
        )
      },

      /**
       * ガイド描画
       */
      drawGuide() {
        this.g.clearRect(0, 0, this.cell.col * this.cell.size, this.cell.row * this.cell.size)
        this.g.strokeStyle = '#000'
        for(let x = 1; x < this.cell.col; x++){
          this.g.beginPath()
          this.g.moveTo(x * this.cell.size, 0)
          this.g.lineTo(x * this.cell.size, this.cell.row * this.cell.size)
          this.g.stroke()
        }
        for(let y = 1; y < this.cell.row; y++){
          this.g.beginPath()
          this.g.moveTo(0, y * this.cell.size)
          this.g.lineTo(this.cell.col * this.cell.size, y * this.cell.size)
          this.g.stroke()
        }
      },

      upload(e) {
        const fileData = e.target.files[0]
        if(!fileData.type.match('image.*')){
          alert('画像を選択してください')
          return
        }
        const fileReader = new FileReader()
        fileReader.onload = (e) => {
          this.c.clearRect(0, 0, this.canvas.width, this.canvas.height)
          const fr = e.target
          const dataUrl = fr.result

          const img = document.createElement('img')
          img.onload = () => {
            const w = img.width
            const h = img.height
            const asp = w/h
            const _asp = this.canvas.width / this.canvas.height
            console.log(asp, _asp)
            if(asp <= _asp){
              // 縦長
              console.log(parseInt(w * this.canvas.height / h, 10),this.canvas.height)
              this.c.drawImage(img, 0, 0, parseInt(w * this.canvas.height / h, 10),this.canvas.height)
            }else{
              // 横長
              this.c.drawImage(img, 0, 0, this.canvas.width, parseInt(h * this.canvas.width / w, 10))
            }
            // console.log(asp, _asp)
            this.pixelize()
          }
          img.src = dataUrl
        }
        fileReader.readAsDataURL(fileData)
      },

      prevent(e) {
        if(this.currentMode === 'capture'){
          e.preventDefault()
        }
      },

      /**
       * ドラッグ&ドロップによるイベント処理
       * @param {object} e - イベントオブジェクト 
       */
      drop(e) {
        if(this.currentMode === 'capture'){
          e.preventDefault()
          const fileList = e.dataTransfer.files
          const fileArray = Array.from(fileList)
          const file = fileArray[0]
          // fileArray.forEach(file => {
            const fileReader = new FileReader()
            fileReader.onload = (e) => {
              this.c.clearRect(0, 0, this.canvas.width, this.canvas.height)
              const fr = e.target
              const dataUrl = fr.result

              const img = document.createElement('img')
              img.onload = () => {
                const w = img.width
                const h = img.height
                const asp = w/h
                const _asp = this.canvas.width / this.canvas.height
                if(asp <= _asp){
                  // 横長
                  this.c.drawImage(img, 0, 0, this.canvas.width, parseInt(h * this.canvas.width / w, 10))
                }else{
                  // 縦長
                  this.c.drawImage(img, 0, 0, parseInt(w * this.canvas.height / h, 10),this.canvas.height)
                }
                // console.log(asp, _asp)
                this.pixelize()
              }
              img.src = dataUrl
            }
            fileReader.readAsDataURL(file)
          // })
        }
      },

      /**
       * ピクセル化
       */
      pixelize() {
        const step = this.cell.size * this.devicePixel

        const setCellColor = (x, y) => {
          const _x = x + step / 2
          const _y = y + step / 2
          const imageData = this.c.getImageData(_x, _y, 1, 1)
          let data = imageData.data
          if(data[3] === 0){
            this.changeDrawType(0)
            this.c.fillRect(x, y, step, step)  
          }else{
            this.changeDrawType(1)
            this.c.fillStyle = this.rgb2hex( [ data[0], data[1], data[2] ] )
            this.c.fillRect(x, y, step, step)
          }
        }        
        for(let y = 0; y < this.canvas.height; y += step){
          for(let x = 0; x < this.canvas.width; x += step){
            setCellColor(x, y)
          }  
        }
      },

      /**
       * base64によるダウンロード
       */
      download() {
        if(this.canvas.msToBlob){
          const blob = this.canvas.msToBlob()
          window.navigator.msSaveBlob(
            blob,
            `pixel_${this.cell.col}_${this.cell.row}_${this.cell.size}.png`
          )
        }else{
          this.btnDownload.href = this.canvas.toDataURL('image/png')
          this.btnDownload.download = `pixel_${this.cell.col}_${this.cell.row}_${this.cell.size}.png`
          this.btnDownload.click()  
        }
      },

      /**
       * box-shadowによるCSS変換
       */
      convertCSS() {
        const step = this.cell.size * this.devicePixel
        const colorObj = {}
        let content = ''

        const getCellColor = (x, y) => {
          // console.log(x,y)
          const _x = x + step / 2
          const _y = y + step / 2
          const imageData = this.c.getImageData(_x, _y, 1, 1)
          let data = imageData.data
          if(data[3] === 0) return
          const v = this.rgb2hex( [ data[0], data[1], data[2] ] )
          colorObj[v] = colorObj[v]? colorObj[v] + 1: 1
          content += `${x/this.devicePixel + this.cell.size}px ${y/this.devicePixel + this.cell.size}px ${v},`
        }

        const getMaxKey = (target) => {
          let maxKeyName, maxVal

          for(let k in target){
            if(!maxKeyName || target[maxKeyName] < target[k]){
              maxKeyName = k
              maxVal = target[k]  
            }
          }
          return maxKeyName
        }

        for(let y = 0; y < this.canvas.height; y += step){
          for(let x = 0; x < this.canvas.width; x += step){
            getCellColor(x, y)
          }  
        }

        const k = getMaxKey(colorObj)
        content = content.substr(0, content.length - 1)
        if(content === '') return
        content = content.replace(new RegExp(` ${k.replace('(', '\\(').replace(')', '\\)')}`, 'g'), '')
        // console.log(content.split(','))
        this.styles.color = k
        this.styles.boxShadow = content
      },

      clear() {
        this.styles.boxShadow = ''
      }

    }
  })

})()