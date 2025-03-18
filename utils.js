export function sanitizeInput(input) {
    return input.replace(/[<>&"']/g, (char) => ({
      '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }
  
  export function shuffleArray(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  }

  // export function sanitizeInput(input) {
  //   return input.replace(/[<>&"']/g, (char) => ({
  //     '<': '<', '>': '>', '&': '&', '"': '"', "'": '''
  //   }[char]));
  // }
  
  // export function shuffleArray(array) {
  //   let currentIndex = array.length, randomIndex;
  //   while (currentIndex !== 0) {
  //     randomIndex = Math.floor(Math.random() * currentIndex);
  //     currentIndex--;
  //     [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  //   }
  //   return array;
  // }