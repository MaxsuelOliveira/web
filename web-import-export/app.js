import { somar , multiplicar , subtracao , divisao} from "./body.js";

document.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();

    let number1 = parseInt(e.srcElement[0].value);
    let number2 = parseInt(e.srcElement[1].value);

    let result = `
        Resultado da soma : ${somar(number1, number2)}
        Resultado da multiplicação : ${multiplicar(number1, number2)}
        Resultado da subtracao : ${subtracao(number1, number2)}
        Resultado da divisao : ${divisao(number1, number2)}
    `;

    document.getElementById('result').innerText = result;
});