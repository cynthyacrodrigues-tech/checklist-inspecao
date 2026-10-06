## Requisitos

| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
| RF01 | O sistema deve identificar o veículo utilizando sua numeração. | Alta | Ao informar uma numeração cadastrada, o sistema deve identificar o veículo corretamente. |
| RF02 | O sistema deve abrir o checklist correspondente ao veículo identificado. | Alta | O checklist apresentado deve corresponder ao veículo informado. |
| RF03 | O sistema deve informar erro quando a numeração do veículo não estiver cadastrada. | Alta | O sistema deve apresentar uma mensagem de erro e impedir o prosseguimento. |
| RF04 | O sistema deve impedir o operador de continuar o checklist quando o veículo não for identificado. | Alta | O operador não deve conseguir avançar sem identificar um veículo válido. |
| RF05 | O sistema deve solicitar a pressão dos pneus durante a inspeção. | Alta | O sistema deve permitir registrar a pressão medida de cada pneu. |
| RF06 | O sistema deve comparar a pressão informada com os valores permitidos para o veículo. | Alta | O sistema deve indicar se a pressão está dentro dos limites definidos. |
| RF07 | O sistema deve alertar o operador quando a pressão dos pneus estiver inadequada. | Alta | Ao informar valor fora do limite, o sistema deve apresentar um alerta. |
| RF08 | O sistema deve impedir o avanço do checklist enquanto a pressão dos pneus estiver inadequada. | Alta | O operador somente deve avançar após a pressão estar dentro do limite aceitável. |
| RF09 | O sistema deve solicitar a verificação do nível de óleo. | Alta | O item de óleo deve ser apresentado durante o checklist. |
| RF10 | O sistema deve permitir informar se o nível de óleo está adequado ou inadequado. | Alta | O operador deve conseguir registrar uma das duas condições. |
| RF11 | O sistema deve alertar o operador quando o nível de óleo estiver inadequado. | Alta | Ao registrar nível inadequado, o sistema deve apresentar um alerta. |
| RF12 | O sistema deve impedir o avanço do checklist enquanto o nível de óleo estiver inadequado. | Alta | O operador não deve conseguir avançar até registrar condição adequada. |
| RF13 | O sistema deve permitir registrar a conclusão de cada item do checklist. | Alta | Cada item deve ficar registrado como concluído após a inspeção. |
| RF14 | O sistema deve registrar o operador responsável pela inspeção. | Alta | O registro da inspeção deve identificar o operador. |
| RF15 | O sistema deve registrar a data e o horário da inspeção. | Alta | Data e horário devem ser gravados automaticamente. |
| RF16 | O sistema deve permitir registrar observações sobre irregularidades encontradas. | Média | O operador deve conseguir inserir uma observação vinculada à inspeção. |
| RF17 | O sistema deve registrar as irregularidades encontradas durante a inspeção. | Alta | Toda irregularidade informada deve ficar associada ao checklist. |
| RF18 | O sistema deve permitir finalizar o checklist somente após o preenchimento dos itens obrigatórios. | Alta | O checklist não deve ser finalizado enquanto houver item obrigatório pendente. |
| RF19 | O sistema deve disponibilizar o histórico das inspeções realizadas por veículo. | Média | Deve ser possível consultar inspeções anteriores de um veículo. |
| RF20 | O sistema deve permitir ao supervisor consultar os checklists realizados. | Alta | O supervisor deve conseguir visualizar as inspeções registradas. |
| RF21 | O sistema deve permitir ao supervisor identificar irregularidades encontradas nas inspeções. | Alta | As irregularidades devem ser apresentadas de forma identificável. |
| RF22 | O sistema deve permitir registrar a tratativa de uma irregularidade. | Alta | Deve ser possível registrar a ação tomada para cada irregularidade. |
| RF23 | O sistema deve permitir à manutenção consultar as irregularidades encaminhadas para atendimento. | Alta | A manutenção deve visualizar as pendências relacionadas aos veículos. |
| RF24 | O sistema deve permitir registrar a correção de uma irregularidade. | Alta | A manutenção deve conseguir registrar que a irregularidade foi corrigida. |
| RF25 | O sistema deve manter o histórico das correções realizadas. | Média | As correções devem permanecer disponíveis para consulta. |
| RF26 | O sistema deve controlar o acesso conforme o perfil do usuário. | Alta | Operador, supervisor e manutenção devem acessar somente as funções permitidas ao seu perfil. |
| RNF01 | O sistema deve estar disponível durante o período de realização das inspeções. | Alta | O sistema deve estar acessível aos usuários durante o horário operacional definido. |
| RNF02 | O sistema deve apresentar as telas do checklist de forma simples e objetiva. | Média | Um operador treinado deve conseguir realizar o checklist sem necessidade de auxílio adicional. |
| RNF03 | O sistema deve proteger os dados das inspeções contra alterações não autorizadas. | Alta | Usuários sem permissão não devem conseguir alterar registros. |
| RNF04 | O sistema deve manter os registros das inspeções armazenados para consulta posterior. | Alta | Uma inspeção finalizada deve permanecer disponível no histórico. |
| RNF05 | O sistema deve apresentar mensagem de erro clara quando uma operação não puder ser realizada. | Média | O usuário deve receber uma mensagem informando o problema ocorrido. |
