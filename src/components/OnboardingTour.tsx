import React, { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const OnboardingTour: React.FC = () => {
    useEffect(() => {
        // Check if tour has been seen
        const hasSeenTour = localStorage.getItem('hasSeenTour');
        
        // Ensure we are on the dashboard to start the tour correctly
        const isDashboard = window.location.pathname === '/' || window.location.pathname === '/dashboard';
        
        // Guided tour is currently disabled
        if (true || hasSeenTour || !isDashboard) return;

        // Small delay to ensure elements are rendered
        const timer = setTimeout(() => {
            const driverObj = driver({
                showProgress: true,
                animate: true,
                doneBtnText: 'Concluir',
                nextBtnText: 'Próximo',
                prevBtnText: 'Anterior',
                steps: [
                    { 
                        popover: { 
                            title: 'Bem-vindo ao InvoiceApp! 🚀', 
                            description: 'Seu novo sistema inteligente de gestão de faturas. Vamos fazer um tour rápido?',
                            side: "center",
                            align: 'center'
                        } 
                    },
                    { 
                        element: '#nav-item-dashboard', 
                        popover: { 
                            title: 'Painel Principal', 
                            description: 'Aqui você tem uma visão geral do seu negócio: faturamento, lucro e pendências.', 
                            side: "right", 
                            align: 'center' 
                        } 
                    },
                    { 
                        element: '#nav-item-invoices', 
                        popover: { 
                            title: 'Gestão de Faturas', 
                            description: 'Crie, edite e envie faturas para seus clientes em segundos.', 
                            side: "right", 
                            align: 'center' 
                        } 
                    },
                    { 
                        element: '#nav-item-ai', 
                        popover: { 
                            title: 'Consultor IA 🤖', 
                            description: 'Seu assistente financeiro pessoal. Peça análises e conselhos sobre suas finanças.', 
                            side: "right", 
                            align: 'center' 
                        } 
                    },
                    { 
                        element: '#header-search', 
                        popover: { 
                            title: 'Busca Inteligente', 
                            description: 'Encontre qualquer coisa: clientes, faturas ou relatórios rapidamente.', 
                            side: "bottom", 
                            align: 'center' 
                        } 
                    },
                    { 
                        element: '#theme-toggle', 
                        popover: { 
                            title: 'Modo Escuro', 
                            description: 'Prefere trabalhar à noite? Alterne para o modo escuro aqui.', 
                            side: "bottom", 
                            align: 'center' 
                        } 
                    },
                    { 
                        popover: { 
                            title: 'Tudo Pronto! ✅', 
                            description: 'Você está pronto para começar. Qualquer dúvida, consulte nossa IA!', 
                            side: "center", 
                            align: 'center' 
                        } 
                    }
                ],
                onDestroyStarted: () => {
                    // Always mark as seen when tour is closed/finished
                    driverObj.destroy();
                    localStorage.setItem('hasSeenTour', 'true');
                },
            });

            driverObj.drive();
        }, 1500); // 1.5s delay to allow dashboard to load

        return () => clearTimeout(timer);
    }, []);

    return null;
};

export default OnboardingTour;
