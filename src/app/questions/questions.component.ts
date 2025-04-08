import { Component } from '@angular/core';
import { HttpClient, HttpClientModule, HttpHeaders, HttpResponse } from '@angular/common/http'; // Importe HttpResponse e HttpHeaders
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-questions',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, HttpClientModule],
  templateUrl: './questions.component.html',
  styleUrls: ['./questions.component.scss']
})
export class QuestionsComponent {
  pergunta: string = '';
  resposta: string = ''; 
  text: string = '';
  logs: string[] = []; 
  historico: Array<{ titulo: string, texto: string }> = [];
  detalhes: string | undefined;
  descricaoImagem: string = ''; // Nova propriedade para descrição da imagem
  imagemGerada: SafeUrl | undefined; // Use SafeUrl
  utterance: SpeechSynthesisUtterance | undefined; // Controle de leitura
  exibirImagens: boolean = false;
  carregandoImagem: boolean = false; // Indicador de carregamento

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

  gerarImagem() {
    this.carregandoImagem = true;
    this.http.post<{ imageUrl: string }>(
        'https://backend-ecos-das-escrituras-ai.onrender.com/api/gerar-imagem',
        { descricao: this.descricaoImagem },
        { headers: { 'Content-Type': 'application/json' } }
    ).subscribe(response => {
        this.carregandoImagem = false;

        if (response && response.imageUrl) {
            // Use DomSanitizer para evitar problemas de segurança
            this.imagemGerada = this.sanitizer.bypassSecurityTrustUrl(response.imageUrl);
            this.logs.push(`Imagem gerada com sucesso: ${this.descricaoImagem}`);
        } else {
            console.error('Erro: Imagem não gerada ou URL vazia.');
            alert('Desculpe, não foi possível gerar a imagem. Por favor, tente novamente.');
        }

        this.descricaoImagem = '';
    }, error => {
        this.carregandoImagem = false;
        console.error('Erro ao gerar a imagem:', error);
        alert('Erro ao comunicar com o servidor. Verifique a conexão e tente novamente.');
        this.descricaoImagem = '';
    });
}

baixarImagem() {
  if (this.imagemGerada) {
    // Converta SafeUrl para string
    const url = this.imagemGerada as string; // Força a conversão para string
    
    // Usando fetch para obter a imagem
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.blob();
      })
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = 'imagem_gerada.png'; // Nome do arquivo para download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl); // Libere a URL criada
      })
      .catch(error => {
        console.error('Erro ao baixar a imagem:', error);
      });
  } else {
    console.error('Imagem não gerada ou indisponível.');
  }
}

  alternarSecao() {
    this.exibirImagens = !this.exibirImagens;
  }

  enviarPergunta() {
    this.http.post<any>('https://backend-ecos-das-escrituras-ai.onrender.com/api/perguntas', { pergunta: this.pergunta })
      .subscribe(response => {
        // Limpa a resposta recebida
        this.resposta = this.limparTexto(response.resposta); 
        this.logs.push(`Pergunta: ${this.pergunta}`); 
        this.logs.push(`Resposta: ${this.resposta}`); 
        const titulo = `Pergunta: ${this.pergunta}`;
        const texto = `Resposta: ${this.resposta}`;
        this.historico.push({ titulo, texto });
      }, error => {
        console.error('Erro ao receber a resposta do servidor:', error);
      });
  }

  // Função para remover asteriscos e outros caracteres indesejados
  limparTexto(texto: string): string {
    return texto.replace(/\*\*/g, '') // Remove os asteriscos duplos
                .replace(/\*/g, '')   // Remove os asteriscos simples
                .replace(/_/g, '');   // Remove underscores, se necessário
  }

  mostrarDetalhes(interacao: { texto: string | undefined; }) {
    this.detalhes = interacao.texto; 
  }

  falarPergunta() {
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'pt-BR';
    
    recognition.start();

    recognition.onresult = (event: any) => {
      this.pergunta = event.results[0][0].transcript; 
      this.logs.push(`Pergunta falada: ${this.pergunta}`); 
    };

    recognition.onerror = (event: any) => {
      console.error('Erro no reconhecimento de voz', event.error);
    };
  }

  falarResposta() {
    if (this.resposta) {
      this.utterance = new SpeechSynthesisUtterance(this.resposta);
      this.utterance.lang = 'pt-BR';
      
      // Encontrar voz feminina
      const voices = speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => voice.name.toLowerCase().includes('female')) || voices[0]; 

      this.utterance.voice = femaleVoice; 
      this.utterance.onend = () => {
        console.log("Leitura concluída.");
      };

      speechSynthesis.speak(this.utterance); 
    } else {
      console.log("Nenhuma resposta para falar.");
    }
  }

  pausarLeitura() {
    if (this.utterance) {
      speechSynthesis.pause(); // Pausa a leitura
    }
  }

  retomarLeitura() {
    if (this.utterance) {
      speechSynthesis.resume(); // Retoma a leitura
    }
  }

  pararLeitura() {
    if (this.utterance) {
      speechSynthesis.cancel(); // Cancela a leitura
      this.utterance = undefined; // Reseta a utterance
    }
  }

  formatText() {
    const lines = this.text.split('\n');
    const newLines = lines.map(line => line.trim()).filter(line => line.length > 0);
    
    this.text = newLines.map(line => '• ' + line).join('\n');
  }
}
