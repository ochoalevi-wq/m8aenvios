import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import Colors from '@/constants/colors';
import { BookOpen, Download, ChevronDown, ChevronUp, Home, Package, PlusCircle, Users, MapPin, Settings, PackageCheck } from 'lucide-react-native';
import { useState } from 'react';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useAuth } from '@/contexts/AuthContext';

interface GuideSection {
  id: string;
  title: string;
  icon: any;
  content: string[];
  steps?: string[];
}

export default function GuideScreen() {
  const { user } = useAuth();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const isAdmin = user?.role === 'admin';
  const isScheduler = user?.role === 'scheduler';
  const isMessenger = user?.role === 'messenger';

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const guideSections: GuideSection[] = [
    {
      id: 'intro',
      title: 'Introducción',
      icon: BookOpen,
      content: [
        'Bienvenido a la aplicación de gestión de entregas y mensajería.',
        'Esta guía te ayudará a entender cómo usar todas las funcionalidades de la aplicación según tu rol.',
        `Tu rol actual es: ${isAdmin ? 'Administrador' : isScheduler ? 'Agendador' : 'Mensajero'}`
      ]
    },
    {
      id: 'dashboard',
      title: 'Dashboard / Inicio',
      icon: Home,
      content: [
        'El Dashboard es la pantalla principal donde puedes ver un resumen de todas las actividades.',
      ],
      steps: isMessenger ? [
        'Ver tus entregas asignadas',
        'Revisar el estado de tus entregas pendientes',
        'Acceder rápidamente a tus recolecciones'
      ] : [
        'Ver estadísticas generales de entregas',
        'Revisar el estado de todos los envíos',
        'Acceder a las funciones principales desde el menú'
      ]
    },
    ...(isAdmin || isScheduler ? [{
      id: 'deliveries',
      title: 'Gestión de Envíos',
      icon: Package,
      content: [
        'Aquí puedes ver todos los envíos registrados en el sistema.',
        'Puedes filtrar por estado: pendiente, en tránsito, entregado o cancelado.'
      ],
      steps: [
        'Accede a "Envíos" desde el menú lateral',
        'Usa los filtros para buscar envíos específicos',
        'Toca un envío para ver sus detalles completos',
        'Cambia el estado del envío según sea necesario'
      ]
    }] : []),
    ...(isAdmin || isScheduler ? [{
      id: 'new-delivery',
      title: 'Crear Nuevo Envío',
      icon: PlusCircle,
      content: [
        'Crea nuevos envíos y asígnalos a mensajeros disponibles.',
      ],
      steps: [
        'Accede a "Nuevo Envío" desde el menú',
        'Completa la información del remitente (nombre, teléfono, dirección)',
        'Completa la información del destinatario',
        'Ingresa el precio del envío',
        'Selecciona un mensajero disponible de la lista',
        'Presiona "Crear Envío" para guardar'
      ]
    }] : []),
    {
      id: 'pickups',
      title: 'Recolecciones',
      icon: PackageCheck,
      content: [
        'Gestiona las recolecciones de paquetes desde establecimientos.',
      ],
      steps: isMessenger ? [
        'Ve a "Recolección" desde el menú',
        'Revisa las recolecciones asignadas a ti',
        'Actualiza el estado cuando completes una recolección'
      ] : [
        'Accede a "Recolección" desde el menú',
        'Presiona el botón "+" para crear una nueva recolección',
        'Completa el formulario con:',
        '  - Nombre del establecimiento',
        '  - Dirección completa',
        '  - Número de teléfono',
        '  - Precio de la recolección',
        'Selecciona un mensajero disponible',
        'Presiona "Crear Recolección" para guardar'
      ]
    },
    ...(isAdmin || isScheduler ? [{
      id: 'messengers',
      title: 'Gestión de Mensajeros',
      icon: Users,
      content: [
        'Administra los mensajeros y su disponibilidad.',
        'Solo los mensajeros marcados como "disponibles" aparecerán en las listas de asignación.'
      ],
      steps: [
        'Accede a "Mensajeros" desde el menú',
        'Ve la lista de todos los mensajeros registrados',
        'Observa el estado de disponibilidad de cada mensajero',
        'Los mensajeros disponibles tienen un indicador verde',
        'Solo los mensajeros disponibles pueden recibir nuevas asignaciones'
      ]
    }] : []),
    ...(isAdmin || isScheduler ? [{
      id: 'locations',
      title: 'Ubicación de Mensajeros',
      icon: MapPin,
      content: [
        'Visualiza la ubicación en tiempo real de todos los mensajeros.',
        'Útil para saber qué mensajero está más cerca de un punto de recolección o entrega.'
      ],
      steps: [
        'Accede a "Ubicaciones" desde el menú',
        'Ve el mapa con las ubicaciones de los mensajeros',
        'Los mensajeros disponibles se muestran con un marcador verde',
        'Los mensajeros no disponibles se muestran con un marcador gris',
        'Toca un marcador para ver información del mensajero'
      ]
    }] : []),
    ...(isMessenger ? [{
      id: 'availability',
      title: 'Gestión de Disponibilidad',
      icon: Settings,
      content: [
        'Como mensajero, puedes controlar tu disponibilidad para recibir asignaciones.',
      ],
      steps: [
        'Ve a "Ajustes" desde el menú',
        'Encuentra la sección "Estado de Disponibilidad"',
        'Activa el interruptor para estar disponible',
        'Desactiva el interruptor cuando no puedas recibir asignaciones',
        'Solo recibirás nuevas asignaciones cuando estés disponible'
      ]
    }] : []),
    ...(isAdmin ? [{
      id: 'users',
      title: 'Gestión de Usuarios',
      icon: Settings,
      content: [
        'Como administrador, puedes crear y gestionar usuarios del sistema.',
      ],
      steps: [
        'Ve a "Ajustes" desde el menú',
        'Encuentra la sección "Gestión de Usuarios"',
        'Presiona el botón "+" para agregar un nuevo usuario',
        'Completa el formulario con:',
        '  - Nombre y apellido',
        '  - Número de teléfono (se agrega automáticamente +502)',
        '  - Nombre de usuario (mínimo 3 caracteres)',
        '  - Contraseña (mínimo 4 caracteres)',
        '  - Rol: Administrador, Mensajero o Agendador',
        'Presiona "Guardar" para crear el usuario',
        'Puedes editar o eliminar usuarios existentes'
      ]
    }] : []),
    {
      id: 'menu',
      title: 'Navegación por el Menú',
      icon: BookOpen,
      content: [
        'El menú lateral te permite acceder a todas las funciones de la aplicación.',
      ],
      steps: [
        'Presiona el ícono de menú (☰) en la esquina superior izquierda',
        'El menú se deslizará desde la izquierda',
        'Selecciona la opción que deseas',
        'El menú se cerrará automáticamente',
        'También puedes cerrar el menú tocando fuera de él'
      ]
    },
    {
      id: 'tips',
      title: 'Consejos y Mejores Prácticas',
      icon: BookOpen,
      content: [
        'Aquí hay algunos consejos para aprovechar al máximo la aplicación:',
      ],
      steps: [
        'Mantén actualizado el estado de tus entregas en tiempo real',
        'Verifica la disponibilidad de los mensajeros antes de asignar',
        'Usa los filtros para encontrar información rápidamente',
        'Revisa el mapa de ubicaciones para optimizar las asignaciones',
        'Mantén los datos de contacto actualizados',
        'Los mensajeros deben activar su disponibilidad para recibir asignaciones'
      ]
    }
  ];

  const generatePDF = async () => {
    try {
      setIsGenerating(true);

      const sectionsHTML = guideSections.map(section => `
        <div style="margin-bottom: 30px; page-break-inside: avoid;">
          <h2 style="color: ${Colors.light.primary}; margin-bottom: 10px; border-bottom: 2px solid ${Colors.light.primary}; padding-bottom: 5px;">
            ${section.title}
          </h2>
          ${section.content.map(text => `<p style="margin: 10px 0; line-height: 1.6;">${text}</p>`).join('')}
          ${section.steps ? `
            <ol style="margin: 15px 0; padding-left: 25px;">
              ${section.steps.map(step => `<li style="margin: 8px 0; line-height: 1.6;">${step}</li>`).join('')}
            </ol>
          ` : ''}
        </div>
      `).join('');

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                padding: 40px;
                color: #1F2937;
                line-height: 1.6;
              }
              h1 {
                color: ${Colors.light.primary};
                text-align: center;
                margin-bottom: 10px;
                font-size: 32px;
              }
              .subtitle {
                text-align: center;
                color: #6B7280;
                margin-bottom: 40px;
                font-size: 16px;
              }
              .role-badge {
                background-color: ${Colors.light.primary};
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                display: inline-block;
                margin-bottom: 30px;
                font-weight: 600;
              }
              h2 {
                font-size: 22px;
                margin-top: 30px;
              }
              p {
                font-size: 14px;
              }
              ol, ul {
                font-size: 14px;
              }
              li {
                margin: 8px 0;
              }
              .footer {
                margin-top: 50px;
                padding-top: 20px;
                border-top: 1px solid #E5E7EB;
                text-align: center;
                color: #6B7280;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <h1>Guía de Usuario</h1>
            <div class="subtitle">Sistema de Gestión de Entregas y Mensajería</div>
            <div style="text-align: center;">
              <span class="role-badge">
                ${isAdmin ? 'Administrador' : isScheduler ? 'Agendador' : 'Mensajero'}
              </span>
            </div>
            ${sectionsHTML}
            <div class="footer">
              <p>Generado el ${new Date().toLocaleDateString('es-GT', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
              <p>Usuario: ${user?.name}</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });

      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = uri;
        link.download = `Guia_Usuario_${new Date().getTime()}.pdf`;
        link.click();
        Alert.alert('Éxito', 'La guía se ha descargado correctamente');
      } else {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Compartir Guía de Usuario',
            UTI: 'com.adobe.pdf'
          });
        } else {
          Alert.alert('Éxito', `PDF guardado en: ${uri}`);
        }
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'No se pudo generar el PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <BookOpen color="#FFFFFF" size={28} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Guía de Usuario</Text>
            <Text style={styles.headerSubtitle}>
              Aprende a usar todas las funciones
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          style={[styles.downloadButton, isGenerating && styles.downloadButtonDisabled]}
          onPress={generatePDF}
          disabled={isGenerating}
        >
          <Download color="#FFFFFF" size={20} />
          <Text style={styles.downloadButtonText}>
            {isGenerating ? 'Generando...' : 'Descargar PDF'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>
            Tu rol: {isAdmin ? 'Administrador' : isScheduler ? 'Agendador' : 'Mensajero'}
          </Text>
        </View>

        {guideSections.map((section) => {
          const isExpanded = expandedSections.includes(section.id);
          const Icon = section.icon;

          return (
            <View key={section.id} style={styles.sectionCard}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection(section.id)}
                activeOpacity={0.7}
              >
                <View style={styles.sectionHeaderLeft}>
                  <View style={styles.sectionIcon}>
                    <Icon color={Colors.light.primary} size={24} />
                  </View>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                </View>
                {isExpanded ? (
                  <ChevronUp color={Colors.light.muted} size={24} />
                ) : (
                  <ChevronDown color={Colors.light.muted} size={24} />
                )}
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.sectionContent}>
                  {section.content.map((text, index) => (
                    <Text key={index} style={styles.contentText}>
                      {text}
                    </Text>
                  ))}
                  {section.steps && section.steps.length > 0 && (
                    <View style={styles.stepsContainer}>
                      <Text style={styles.stepsTitle}>Pasos:</Text>
                      {section.steps.map((step, index) => (
                        <View key={index} style={styles.stepItem}>
                          <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>{index + 1}</Text>
                          </View>
                          <Text style={styles.stepText}>{step}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ¿Necesitas más ayuda? Contacta al administrador del sistema.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    backgroundColor: Colors.light.primary,
    padding: 20,
    paddingTop: 20,
    gap: 16,
  },
  headerContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 16,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  downloadButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  downloadButtonDisabled: {
    opacity: 0.6,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  roleBadge: {
    backgroundColor: Colors.light.card,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    alignSelf: 'center' as const,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  roleBadgeText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.light.primary,
  },
  sectionCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden' as const,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    flex: 1,
  },
  sectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.background,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    flex: 1,
  },
  sectionContent: {
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  contentText: {
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 22,
  },
  stepsContainer: {
    marginTop: 8,
    gap: 12,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  stepItem: {
    flexDirection: 'row' as const,
    gap: 12,
    alignItems: 'flex-start' as const,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 22,
  },
  footer: {
    marginTop: 24,
    padding: 20,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  footerText: {
    fontSize: 14,
    color: Colors.light.muted,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
});
