# Calculadora de Crédito com Garantia de Imóvel (EGI)

Este módulo é responsável pelo motor de cálculo financeiro do produto **EGI (Home Equity)**. Ele integra regras de garantia real (LTV), capacidade de pagamento (DTI) e seleção dinâmica de taxas baseadas em faixas de valor e cenários de ocupação.

---

## 📌 Regras de Garantia (LTV - Loan to Value)

A base do crédito é calculada diretamente sobre o valor de avaliação do imóvel:

* **Quota de Financiamento:** 60% do valor do imóvel.
* **Valor da Garantia:** $Valor do Imóvel \times 0.60$.
* **Abatimento de Dívida:** Caso o imóvel possua saldo devedor, este é subtraído do teto da garantia para determinar o **Crédito Líquido**.
    * `Valor Disponível = (Valor do Imóvel * 0.60) - Saldo Devedor`

---

## 📊 Matriz de Cenários, Taxas e Prazos

As taxas de juros são definidas pelo cenário do imóvel e pelo **Ponto de Corte**, aplicado sobre os 60% do valor do imóvel (Valor da Garantia).

| Cenário | Condição | Prazo | Taxa (Garantia ≤ 100k) | Taxa (Garantia > 100k) |
| :--- | :--- | :--- | :--- | :--- |
| **Quitado** | Saldo Devedor = 0 | 20 Anos | 22.13% a.a. | 17.46% a.a. |
| **Estensão** | Saldo Devedor > 0 | 30 Anos | 20.983% a.a. | 17.042% a.a. |
| **Liquidação** | Opção Selecionada | 20 a 30 Anos (se liquidaçao + estensão) | *Não Permitido* | 15.12% a.a. |

> **Importante:** O cenário de **Liquidação Simultânea** oferece a taxa mais atrativa (15.12% a.a.), mas possui uma trava de segurança que exige uma garantia mínima superior a R$ 100.000,00.

---

## 💳 Capacidade de Pagamento (DTI - Debt to Income)

Aprovamos o crédito desde que a prestação não ultrapasse o limite de comprometimento da renda bruta do cliente.

* **Margem Consignável:** 30% da renda bruta mensal.
* **Sistema de Amortização:** Tabela Price (Parcelas fixas).
* **Cálculo:** O sistema realiza o cálculo do **Valor Presente (VP)** para garantir que o empréstimo caiba na margem de 30% da renda ao longo do prazo estabelecido.



---

## 🚫 Restrições e Validações (Hard Rules)

O motor de cálculo valida as seguintes condições impeditivas:

1.  **Valor Mínimo do Imóvel:** R$ 50.000,00.
2.  **Ticket Mínimo de Crédito:** R$ 50.000,00 (O valor final aprovado deve ser maior ou igual a este montante).
3.  **Trava de Liquidação:** Bloqueio automático se a base de garantia for inferior a R$ 100.000,00.
4.  **Minimizador de Risco:** O valor final aprovado será sempre o **menor** entre o limite da garantia (60%) e o limite da renda (30%).

---

