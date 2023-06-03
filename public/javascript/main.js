

// function getImagePath(dogImageType,dogImage){
//     console.log('withinL',dogImage)
//     const imageUrl = URL.createObjectURL(dogImage);
//     console(imageUrl)
//     // const path = `data:${dogImageType};charset=utf-8;base64,${dogImage['data'].join('').toString('base64')}`
//     return path  
// }

// function toBase64(arr) {
//     //arr = new Uint8Array(arr) if it's an ArrayBuffer
//     return btoa(
//        arr.reduce((data, byte) => data + String.fromCharCode(byte), '')
//     );
//  }


async function getDog(){
    const res = await fetch('/api/getDog')
    const dog = await res.json()
    //console.log(dog)
    if(dog){
        //console.log(dog)
        const div = document.createElement('div');
        div.classList.add('card', 'd-flex','dog-single-card','my-4')
        document.body.appendChild(div);

        const card = document.createElement('div')
        card.classList.add('card-body','card-append')
        document.body.querySelector('.dog-single-card').append(card)

        dog.forEach(obj =>{
            console.log('here',obj)
            const keys = Object.keys(obj)

            // if(Object.hasOwn(obj,'dogImage') && Object.hasOwn(obj,'dogImageType')){
            //     console.log(obj['dogImage'])
            //     const dogImagePath = getImagePath(obj['dogImageType'],obj['dogImage'])
            //     console.log(dogImagePath)
            //     const img = document.createElement('img')
            //     img.setAttribute('src',dogImagePath)
            // }

            const revealedInfo = ['_id','createdAt','slug','__v','user','dogImage', 'dogImageType']
            const showninfo = keys.filter(key => ! revealedInfo.includes(key))
            console.log(showninfo)
            showninfo.forEach(key=> {
                const p = document.createElement('p')
                p.textContent = `${key}: ${obj[key]}`
                document.querySelector('.card-append').appendChild(p)
                //console.log(key);
              });

        })
        
    }
}

function main(){
    console.log('hi1')
    getDog()
    
}

document.addEventListener('DOMContentLoaded', main);