import { Component } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

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
  logs: string[] = []; 
  historico: Array<{ titulo: string, texto: string }> = [];
  detalhes: string | undefined;
  utterance: SpeechSynthesisUtterance | undefined; // Para controlar a leitura

  constructor(private http: HttpClient) {}

  enviarPergunta() {
    this.http.post<any>('https://backend-ecos-das-escrituras-ai.onrender.com/api/perguntas', { pergunta: this.pergunta })
      .subscribe(response => {
        this.resposta = response.resposta; 
        this.logs.push(`Pergunta: ${this.pergunta}`); 
        this.logs.push(`Resposta: ${this.resposta}`); 
        const titulo = `Pergunta: ${this.pergunta}`;
        const texto = `Resposta: ${this.resposta}`;
        this.historico.push({ titulo, texto });
      }, error => {
        console.error('Erro ao receber a resposta do servidor:', error);
      });
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
}