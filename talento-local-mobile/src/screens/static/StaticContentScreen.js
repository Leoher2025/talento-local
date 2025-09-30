// src/screens/static/StaticContentScreen.js
// Pantalla para mostrar contenido estático (Términos, Política, Ayuda, Acerca de)

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../../utils/constants';

export default function StaticContentScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { type, title } = route.params;

  const getContent = () => {
    switch (type) {
      case 'terms':
        return <TermsContent />;
      case 'privacy':
        return <PrivacyContent />;
      case 'help':
        return <HelpContent />;
      case 'about':
        return <AboutContent />;
      default:
        return <DefaultContent />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title || 'Información'}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Contenido */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {getContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

// Componente de Términos y Condiciones
const TermsContent = () => (
  <View style={styles.content}>
    <Text style={styles.lastUpdate}>Última actualización: Enero 2024</Text>
    
    <Text style={styles.title}>📋 Términos y Condiciones de Uso</Text>
    
    <Text style={styles.paragraph}>
      Bienvenido a Talento Local. Al usar nuestra aplicación, aceptas estos términos y condiciones. 
      Por favor, léelos cuidadosamente.
    </Text>

    <Text style={styles.sectionTitle}>1. Aceptación de los Términos</Text>
    <Text style={styles.paragraph}>
      Al acceder y utilizar Talento Local, aceptas cumplir con estos términos de servicio, 
      todas las leyes y regulaciones aplicables. Si no estás de acuerdo con alguno de estos términos, 
      no debes usar nuestra aplicación.
    </Text>

    <Text style={styles.sectionTitle}>2. Descripción del Servicio</Text>
    <Text style={styles.paragraph}>
      Talento Local es una plataforma que conecta clientes con trabajadores locales para diversos servicios. 
      Actuamos como intermediarios y no somos responsables directos de la calidad del trabajo realizado.
    </Text>

    <Text style={styles.sectionTitle}>3. Registro de Usuario</Text>
    <Text style={styles.paragraph}>
      • Debes proporcionar información verdadera y completa{'\n'}
      • Eres responsable de mantener la confidencialidad de tu cuenta{'\n'}
      • Debes notificarnos inmediatamente sobre cualquier uso no autorizado{'\n'}
      • Debes ser mayor de 18 años para usar el servicio
    </Text>

    <Text style={styles.sectionTitle}>4. Responsabilidades del Usuario</Text>
    <Text style={styles.paragraph}>
      Como usuario de Talento Local, te comprometes a:{'\n\n'}
      • No usar el servicio para actividades ilegales{'\n'}
      • Respetar a otros usuarios de la plataforma{'\n'}
      • No compartir contenido ofensivo o inapropiado{'\n'}
      • Cumplir con los acuerdos establecidos con otros usuarios
    </Text>

    <Text style={styles.sectionTitle}>5. Para Trabajadores</Text>
    <Text style={styles.paragraph}>
      Si eres trabajador en nuestra plataforma:{'\n\n'}
      • Debes proporcionar servicios de calidad{'\n'}
      • Cumplir con los tiempos acordados{'\n'}
      • Mantener una comunicación profesional{'\n'}
      • Contar con las habilidades que declaras tener
    </Text>

    <Text style={styles.sectionTitle}>6. Para Clientes</Text>
    <Text style={styles.paragraph}>
      Si eres cliente en nuestra plataforma:{'\n\n'}
      • Debes proporcionar información clara sobre el trabajo{'\n'}
      • Pagar puntualmente por los servicios recibidos{'\n'}
      • Respetar a los trabajadores{'\n'}
      • Proporcionar un ambiente de trabajo seguro
    </Text>

    <Text style={styles.sectionTitle}>7. Pagos y Comisiones</Text>
    <Text style={styles.paragraph}>
      • Los pagos se realizan directamente entre clientes y trabajadores{'\n'}
      • Talento Local puede cobrar comisiones por el uso de la plataforma{'\n'}
      • Los precios son acordados entre las partes{'\n'}
      • No nos hacemos responsables por disputas de pago
    </Text>

    <Text style={styles.sectionTitle}>8. Cancelaciones</Text>
    <Text style={styles.paragraph}>
      • Las cancelaciones deben comunicarse con anticipación{'\n'}
      • Pueden aplicar penalizaciones por cancelaciones tardías{'\n'}
      • Los reembolsos se manejan caso por caso
    </Text>

    <Text style={styles.sectionTitle}>9. Limitación de Responsabilidad</Text>
    <Text style={styles.paragraph}>
      Talento Local no será responsable por daños indirectos, incidentales, especiales o consecuenciales 
      que resulten del uso o la imposibilidad de usar el servicio.
    </Text>

    <Text style={styles.sectionTitle}>10. Modificaciones</Text>
    <Text style={styles.paragraph}>
      Nos reservamos el derecho de modificar estos términos en cualquier momento. 
      Los cambios entrarán en vigor inmediatamente después de su publicación en la aplicación.
    </Text>

    <Text style={styles.sectionTitle}>11. Contacto</Text>
    <Text style={styles.paragraph}>
      Si tienes preguntas sobre estos términos, contáctanos en:{'\n'}
      soporte@talentolocal.com
    </Text>
  </View>
);

// Componente de Política de Privacidad
const PrivacyContent = () => (
  <View style={styles.content}>
    <Text style={styles.lastUpdate}>Última actualización: Enero 2024</Text>
    
    <Text style={styles.title}>🔒 Política de Privacidad</Text>
    
    <Text style={styles.paragraph}>
      En Talento Local, tu privacidad es importante para nosotros. Esta política describe cómo 
      recopilamos, usamos y protegemos tu información personal.
    </Text>

    <Text style={styles.sectionTitle}>1. Información que Recopilamos</Text>
    <Text style={styles.paragraph}>
      Recopilamos información que nos proporcionas directamente:{'\n\n'}
      • Nombre y apellidos{'\n'}
      • Correo electrónico{'\n'}
      • Número de teléfono{'\n'}
      • Dirección{'\n'}
      • Información de perfil profesional{'\n'}
      • Fotos de perfil y trabajos realizados
    </Text>

    <Text style={styles.sectionTitle}>2. Uso de la Información</Text>
    <Text style={styles.paragraph}>
      Utilizamos tu información para:{'\n\n'}
      • Crear y mantener tu cuenta{'\n'}
      • Conectarte con clientes o trabajadores{'\n'}
      • Procesar pagos y transacciones{'\n'}
      • Enviar notificaciones importantes{'\n'}
      • Mejorar nuestros servicios{'\n'}
      • Cumplir con obligaciones legales
    </Text>

    <Text style={styles.sectionTitle}>3. Compartir Información</Text>
    <Text style={styles.paragraph}>
      No vendemos tu información personal. Compartimos información solo:{'\n\n'}
      • Con otros usuarios para facilitar servicios{'\n'}
      • Con proveedores de servicios que nos ayudan{'\n'}
      • Cuando es requerido por ley{'\n'}
      • Con tu consentimiento explícito
    </Text>

    <Text style={styles.sectionTitle}>4. Seguridad de Datos</Text>
    <Text style={styles.paragraph}>
      Implementamos medidas de seguridad para proteger tu información:{'\n\n'}
      • Encriptación de datos sensibles{'\n'}
      • Acceso restringido a información personal{'\n'}
      • Monitoreo regular de seguridad{'\n'}
      • Cumplimiento con estándares de la industria
    </Text>

    <Text style={styles.sectionTitle}>5. Tus Derechos</Text>
    <Text style={styles.paragraph}>
      Tienes derecho a:{'\n\n'}
      • Acceder a tu información personal{'\n'}
      • Corregir información incorrecta{'\n'}
      • Solicitar eliminación de tu cuenta{'\n'}
      • Oponerte a ciertos usos de tu información{'\n'}
      • Portabilidad de datos
    </Text>

    <Text style={styles.sectionTitle}>6. Cookies y Tecnologías Similares</Text>
    <Text style={styles.paragraph}>
      Utilizamos cookies y tecnologías similares para:{'\n\n'}
      • Mantener tu sesión activa{'\n'}
      • Recordar tus preferencias{'\n'}
      • Analizar el uso de la aplicación{'\n'}
      • Personalizar tu experiencia
    </Text>

    <Text style={styles.sectionTitle}>7. Menores de Edad</Text>
    <Text style={styles.paragraph}>
      Nuestro servicio no está dirigido a menores de 18 años. No recopilamos 
      intencionalmente información de menores de edad.
    </Text>

    <Text style={styles.sectionTitle}>8. Cambios en la Política</Text>
    <Text style={styles.paragraph}>
      Podemos actualizar esta política ocasionalmente. Te notificaremos sobre 
      cambios significativos a través de la aplicación o por correo electrónico.
    </Text>

    <Text style={styles.sectionTitle}>9. Contacto</Text>
    <Text style={styles.paragraph}>
      Para preguntas sobre privacidad, contáctanos en:{'\n'}
      privacidad@talentolocal.com
    </Text>
  </View>
);

// Componente de Ayuda y Soporte
const HelpContent = () => {
  const handleEmailSupport = () => {
    Linking.openURL('mailto:soporte@talentolocal.com');
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:+50212345678');
  };

  const handleWhatsApp = () => {
    Linking.openURL('whatsapp://send?phone=50212345678&text=Hola, necesito ayuda con Talento Local');
  };

  return (
    <View style={styles.content}>
      <Text style={styles.title}>❓ Centro de Ayuda</Text>
      
      <Text style={styles.paragraph}>
        Estamos aquí para ayudarte. Encuentra respuestas a las preguntas más frecuentes 
        o contacta con nuestro equipo de soporte.
      </Text>

      <Text style={styles.sectionTitle}>Preguntas Frecuentes</Text>

      <View style={styles.faqItem}>
        <Text style={styles.faqQuestion}>¿Cómo creo una cuenta?</Text>
        <Text style={styles.faqAnswer}>
          Descarga la app, selecciona "Crear cuenta", elige si eres cliente o trabajador, 
          completa tus datos y verifica tu correo electrónico.
        </Text>
      </View>

      <View style={styles.faqItem}>
        <Text style={styles.faqQuestion}>¿Cómo publico un trabajo?</Text>
        <Text style={styles.faqAnswer}>
          Como cliente, ve a "Publicar trabajo", describe lo que necesitas, establece 
          un presupuesto y ubicación, y espera las aplicaciones de trabajadores.
        </Text>
      </View>

      <View style={styles.faqItem}>
        <Text style={styles.faqQuestion}>¿Cómo aplico a un trabajo?</Text>
        <Text style={styles.faqAnswer}>
          Como trabajador, busca trabajos disponibles, selecciona uno que te interese, 
          revisa los detalles y presiona "Aplicar" con tu propuesta.
        </Text>
      </View>

      <View style={styles.faqItem}>
        <Text style={styles.faqQuestion}>¿Cómo funcionan los pagos?</Text>
        <Text style={styles.faqAnswer}>
          Los pagos se acuerdan directamente entre cliente y trabajador. Recomendamos 
          usar métodos seguros y documentar los acuerdos.
        </Text>
      </View>

      <View style={styles.faqItem}>
        <Text style={styles.faqQuestion}>¿Qué hago si tengo un problema?</Text>
        <Text style={styles.faqAnswer}>
          Puedes reportar problemas desde el perfil del usuario o trabajo, o contactar 
          directamente a nuestro equipo de soporte.
        </Text>
      </View>

      <View style={styles.faqItem}>
        <Text style={styles.faqQuestion}>¿Cómo cancelo un trabajo?</Text>
        <Text style={styles.faqAnswer}>
          Ve a "Mis trabajos", selecciona el trabajo y presiona "Cancelar". Ten en cuenta 
          que pueden aplicar penalizaciones según los términos acordados.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Contacta con Soporte</Text>
      
      <TouchableOpacity style={styles.contactButton} onPress={handleEmailSupport}>
        <Text style={styles.contactIcon}>✉️</Text>
        <View style={styles.contactInfo}>
          <Text style={styles.contactTitle}>Correo Electrónico</Text>
          <Text style={styles.contactDetail}>soporte@talentolocal.com</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.contactButton} onPress={handleCallSupport}>
        <Text style={styles.contactIcon}>📞</Text>
        <View style={styles.contactInfo}>
          <Text style={styles.contactTitle}>Teléfono</Text>
          <Text style={styles.contactDetail}>+502 1234-5678</Text>
          <Text style={styles.contactHours}>Lun-Vie 8:00 AM - 6:00 PM</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.contactButton} onPress={handleWhatsApp}>
        <Text style={styles.contactIcon}>💬</Text>
        <View style={styles.contactInfo}>
          <Text style={styles.contactTitle}>WhatsApp</Text>
          <Text style={styles.contactDetail}>+502 1234-5678</Text>
          <Text style={styles.contactHours}>Respuesta en 24 horas</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoIcon}>💡</Text>
        <Text style={styles.infoText}>
          Tip: Para una respuesta más rápida, incluye tu ID de usuario y describe 
          detalladamente tu problema.
        </Text>
      </View>
    </View>
  );
};

// Componente Acerca de
const AboutContent = () => (
  <View style={styles.content}>
    <View style={styles.logoContainer}>
      <Text style={styles.logo}>🛠️</Text>
      <Text style={styles.appName}>Talento Local</Text>
      <Text style={styles.version}>Versión 1.0.0</Text>
    </View>
    
    <Text style={styles.title}>Acerca de Nosotros</Text>
    
    <Text style={styles.paragraph}>
      Talento Local es la plataforma líder en Guatemala que conecta a personas que necesitan 
      servicios con trabajadores locales calificados. Nuestra misión es facilitar el acceso 
      a oportunidades de trabajo y servicios de calidad en tu comunidad.
    </Text>

    <Text style={styles.sectionTitle}>Nuestra Misión</Text>
    <Text style={styles.paragraph}>
      Empoderar a trabajadores independientes y pequeños negocios locales, mientras 
      proporcionamos a los clientes acceso fácil y confiable a servicios de calidad 
      en su área.
    </Text>

    <Text style={styles.sectionTitle}>Nuestra Visión</Text>
    <Text style={styles.paragraph}>
      Ser la plataforma de referencia en Centroamérica para la conexión entre 
      trabajadores locales y clientes, promoviendo el desarrollo económico y 
      social de las comunidades.
    </Text>

    <Text style={styles.sectionTitle}>Valores</Text>
    <Text style={styles.bulletPoint}>• 🤝 Confianza: Construimos relaciones basadas en la transparencia</Text>
    <Text style={styles.bulletPoint}>• 💼 Profesionalismo: Promovemos altos estándares de calidad</Text>
    <Text style={styles.bulletPoint}>• 🌟 Excelencia: Buscamos superar las expectativas</Text>
    <Text style={styles.bulletPoint}>• 🏘️ Comunidad: Fortalecemos los lazos locales</Text>
    <Text style={styles.bulletPoint}>• 🚀 Innovación: Mejoramos constantemente nuestra plataforma</Text>

    <Text style={styles.sectionTitle}>El Equipo</Text>
    <Text style={styles.paragraph}>
      Somos un equipo apasionado de profesionales guatemaltecos comprometidos con 
      mejorar la forma en que las personas encuentran y ofrecen servicios en su comunidad.
    </Text>

    <Text style={styles.sectionTitle}>Características</Text>
    <Text style={styles.bulletPoint}>• ✅ Verificación de usuarios</Text>
    <Text style={styles.bulletPoint}>• ⭐ Sistema de calificaciones</Text>
    <Text style={styles.bulletPoint}>• 💬 Chat integrado</Text>
    <Text style={styles.bulletPoint}>• 📍 Búsqueda por ubicación</Text>
    <Text style={styles.bulletPoint}>• 🔒 Pagos seguros</Text>
    <Text style={styles.bulletPoint}>• 📱 Notificaciones en tiempo real</Text>

    <Text style={styles.sectionTitle}>Contacto</Text>
    <Text style={styles.contactText}>📧 info@talentolocal.com</Text>
    <Text style={styles.contactText}>🌐 www.talentolocal.com</Text>
    <Text style={styles.contactText}>📍 Ciudad de Guatemala, Guatemala</Text>

    <View style={styles.socialContainer}>
      <Text style={styles.sectionTitle}>Síguenos</Text>
      <View style={styles.socialButtons}>
        <TouchableOpacity 
          style={styles.socialButton}
          onPress={() => Linking.openURL('https://facebook.com/talentolocal')}
        >
          <Text style={styles.socialIcon}>📘</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.socialButton}
          onPress={() => Linking.openURL('https://instagram.com/talentolocal')}
        >
          <Text style={styles.socialIcon}>📷</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.socialButton}
          onPress={() => Linking.openURL('https://twitter.com/talentolocal')}
        >
          <Text style={styles.socialIcon}>🐦</Text>
        </TouchableOpacity>
      </View>
    </View>

    <Text style={styles.copyright}>
      © 2024 Talento Local. Todos los derechos reservados.
    </Text>
  </View>
);

// Componente por defecto
const DefaultContent = () => (
  <View style={styles.content}>
    <Text style={styles.title}>Información</Text>
    <Text style={styles.paragraph}>
      No se encontró contenido para mostrar.
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  
  backButton: {
    padding: SPACING.xs,
  },
  
  backIcon: {
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.text.primary,
  },
  
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  
  placeholder: {
    width: 30,
  },
  
  scrollContent: {
    flexGrow: 1,
  },
  
  content: {
    padding: SPACING.lg,
  },
  
  lastUpdate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
    marginBottom: SPACING.md,
  },
  
  title: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.lg,
  },
  
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  
  paragraph: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  
  bulletPoint: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
    lineHeight: 24,
    marginBottom: SPACING.xs,
    paddingLeft: SPACING.sm,
  },
  
  // Estilos para FAQ
  faqItem: {
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  
  faqQuestion: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  
  faqAnswer: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  
  // Estilos para contacto
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  
  contactIcon: {
    fontSize: FONT_SIZES['2xl'],
    marginRight: SPACING.md,
  },
  
  contactInfo: {
    flex: 1,
  },
  
  contactTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  
  contactDetail: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
  
  contactHours: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  
  // Info box
  infoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.info + '10',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  
  infoIcon: {
    fontSize: FONT_SIZES.xl,
    marginRight: SPACING.sm,
  },
  
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.info,
    lineHeight: 18,
  },
  
  // Estilos para About
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  
  logo: {
    fontSize: 60,
    marginBottom: SPACING.sm,
  },
  
  appName: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  
  version: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },
  
  contactText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  
  socialContainer: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  
  socialButtons: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
  },
  
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  
  socialIcon: {
    fontSize: FONT_SIZES['2xl'],
  },
  
  copyright: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: SPACING.xl,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
});