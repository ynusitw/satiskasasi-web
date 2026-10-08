<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="open"
           class="fixed inset-0 z-[200] flex items-center justify-center p-4">

        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"
             @click="$emit('update:open', false)"/>

        <!-- Panel -->
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl
                    max-h-[88vh] flex flex-col overflow-hidden">

          <!-- Başlık -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0
                           002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0
                           001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0
                           00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0
                           00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0
                           00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0
                           00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0
                           001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07
                           2.572-1.065z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <div>
                <h2 class="font-bold text-base text-primary leading-tight">Sistem Ayarları</h2>
                <p class="text-xs text-muted">Tercihler, güvenlik ve destek</p>
              </div>
            </div>
            <button @click="$emit('update:open', false)"
                    class="p-2 rounded-xl hover:bg-gray-100 text-muted hover:text-primary transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Gövde -->
          <div class="flex flex-1 min-h-0">

            <!-- Sol sekme navigasyonu -->
            <nav class="w-44 bg-gray-50 border-r border-gray-100 p-3 flex flex-col gap-1 flex-shrink-0">
              <button v-for="tab in tabs" :key="tab.id"
                      @click="activeTab = tab.id"
                      class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm
                             font-medium transition-all text-left w-full"
                      :class="activeTab === tab.id
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-muted hover:text-primary hover:bg-white'">
                <component :is="tab.icon" class="w-4 h-4 flex-shrink-0"/>
                {{ tab.label }}
              </button>
            </nav>

            <!-- Sağ içerik -->
            <div class="flex-1 overflow-y-auto p-6">

              <!-- ══════════════ GÖRÜNÜM ══════════════ -->
              <section v-if="activeTab === 'ui'">
                <SectionHeader title="Görünüm ve Tema"
                               desc="Aydınlık, karanlık ya da sisteminizin otomatik temasını seçin."/>

                <div class="grid grid-cols-3 gap-3 mb-6">
                  <button v-for="opt in themeOptions" :key="opt.value"
                          @click="settings.theme = opt.value"
                          class="flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all"
                          :class="settings.theme === opt.value
                            ? 'border-accent bg-accent/5 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'">
                    <!-- Önizleme -->
                    <div class="w-20 h-12 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                      <div class="h-3 flex items-center gap-1 px-2" :class="opt.topBg">
                        <div class="w-1.5 h-1.5 rounded-full opacity-60" :class="opt.dotColor"/>
                      </div>
                      <div class="flex-1 h-full p-1.5 gap-1 flex flex-col" :class="opt.bodyBg">
                        <div class="h-1.5 rounded opacity-40" :class="opt.lineBg" style="width:70%"/>
                        <div class="h-1.5 rounded opacity-30" :class="opt.lineBg" style="width:50%"/>
                      </div>
                    </div>
                    <span class="text-xs font-semibold"
                          :class="settings.theme === opt.value ? 'text-accent' : 'text-primary'">
                      {{ opt.label }}
                    </span>
                    <!-- Radio -->
                    <div class="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors"
                         :class="settings.theme === opt.value ? 'border-accent' : 'border-gray-300'">
                      <div v-if="settings.theme === opt.value"
                           class="w-2 h-2 rounded-full bg-accent"/>
                    </div>
                  </button>
                </div>

                <div class="p-3 bg-blue-50 rounded-xl flex gap-2 text-xs text-blue-700">
                  <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span><strong>Sistem Varsayılanı</strong> seçildiğinde bilgisayarınız akşam otomatik karanlık temaya geçerse panel de buna uyum sağlar.</span>
                </div>
              </section>

              <!-- ══════════════ GÜVENLİK ══════════════ -->
              <section v-else-if="activeTab === 'security'">
                <SectionHeader title="Güvenlik ve Oturum Yönetimi"
                               desc="Aktif cihazlarınızı ve güvenlik ayarlarınızı yönetin."/>

                <!-- Aktif Oturumlar -->
                <div class="mb-6">
                  <div class="flex items-center justify-between mb-3">
                    <h4 class="text-sm font-bold text-primary">Aktif Oturumlar</h4>
                    <button @click="logoutAll"
                            :disabled="revoking || sessions.length <= 1"
                            class="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors
                                   disabled:opacity-40 disabled:cursor-not-allowed"
                            :class="revoking
                              ? 'bg-gray-100 text-gray-400'
                              : 'bg-red-50 text-red-600 hover:bg-red-100'">
                      {{ revoking ? 'İşleniyor...' : 'Tüm diğer cihazlardan çıkış yap' }}
                    </button>
                  </div>

                  <!-- Yükleniyor -->
                  <div v-if="sessionsLoading"
                       class="flex items-center justify-center py-8 text-muted text-sm gap-2">
                    <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                      <path class="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Oturumlar yükleniyor...
                  </div>

                  <!-- Hata -->
                  <div v-else-if="sessionsError"
                       class="p-3 bg-red-50 rounded-xl text-xs text-red-700">
                    {{ sessionsError }}
                  </div>

                  <!-- Liste -->
                  <div v-else class="space-y-2">
                    <div v-for="s in sessions" :key="s.id"
                         class="flex items-center gap-3 p-3 rounded-xl border border-gray-100
                                bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                           :class="s.isCurrent ? 'bg-accent/15' : 'bg-gray-200'">
                        <component :is="isMobile(s.deviceInfo) ? IconPhone : IconMonitor"
                                   class="w-5 h-5"
                                   :class="s.isCurrent ? 'text-accent' : 'text-muted'"/>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                          <span class="text-sm font-semibold text-primary truncate">
                            {{ s.deviceInfo ?? 'Bilinmeyen cihaz' }}
                          </span>
                          <span v-if="s.isCurrent"
                                class="text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent font-bold flex-shrink-0">
                            Bu cihaz
                          </span>
                        </div>
                        <div class="text-xs text-muted">
                          {{ s.ipAddress ?? '' }}
                          <span v-if="s.createdAt"> · {{ timeAgo(s.createdAt) }}</span>
                        </div>
                      </div>
                      <div class="w-2 h-2 rounded-full flex-shrink-0"
                           :class="s.isCurrent ? 'bg-success' : 'bg-gray-300'"/>
                    </div>
                    <div v-if="!sessions.length" class="text-sm text-muted text-center py-6">
                      Aktif oturum bulunamadı.
                    </div>
                  </div>
                </div>

                <!-- 2FA -->
                <div class="border border-gray-200 rounded-xl p-4">
                  <div class="flex items-start justify-between gap-4">
                    <div>
                      <h4 class="text-sm font-bold text-primary mb-1">İki Adımlı Doğrulama (2FA)</h4>
                      <p class="text-xs text-muted">
                        Google Authenticator veya benzeri bir uygulama ile giriş güvenliğinizi artırın.
                        Finansal verileri korumanın en etkili yolu.
                      </p>
                    </div>
                    <div class="flex-shrink-0">
                      <span v-if="tfa.enabled" class="chip-success">Açık</span>
                      <button v-else-if="!tfa.setup" @click="startTwoFactor" :disabled="tfa.busy" class="btn-primary btn-sm">
                        Etkinleştir
                      </button>
                    </div>
                  </div>

                  <!-- Kurulum: QR + ilk kod -->
                  <div v-if="tfa.setup && !tfa.recoveryCodes" class="mt-4 flex gap-5 flex-wrap">
                    <img v-if="tfa.qr" :src="tfa.qr" alt="QR kod" width="168" height="168" class="rounded-lg border border-gray-100 bg-white"/>
                    <div class="flex-1 min-w-[220px]">
                      <ol class="text-xs text-muted space-y-1 list-decimal pl-4 mb-3">
                        <li>Telefonunuzda Google Authenticator, Microsoft Authenticator gibi bir uygulama açın.</li>
                        <li>QR kodu okutun (okutamazsanız anahtarı elle girin).</li>
                        <li>Uygulamanın gösterdiği 6 haneli kodu yazın.</li>
                      </ol>
                      <div class="text-[11px] text-muted mb-1">Anahtar</div>
                      <div class="font-mono text-[12.5px] bg-gray-50 rounded-lg px-2.5 py-1.5 mb-3 select-all break-all">{{ tfa.secret }}</div>
                      <div class="flex gap-2">
                        <input v-model="tfa.code" inputmode="numeric" maxlength="6" placeholder="000000"
                               class="w-32 px-3 h-9 border border-gray-200 rounded-lg text-[14px] tracking-widest text-center bg-white"/>
                        <button class="btn-primary btn-sm" :disabled="tfa.busy" @click="confirmTwoFactor">Doğrula ve aç</button>
                        <button class="btn-ghost btn-sm" @click="tfa.setup = false">Vazgeç</button>
                      </div>
                    </div>
                  </div>

                  <!-- Kurtarma kodları (bir kez gösterilir) -->
                  <div v-if="tfa.recoveryCodes" class="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <div class="text-sm font-semibold text-amber-900 mb-1">Kurtarma kodlarınızı saklayın</div>
                    <p class="text-xs text-amber-800 mb-3">
                      Telefonunuza erişemezseniz bu kodlarla giriş yapabilirsiniz; her biri bir kez kullanılır.
                      Bu kodlar bir daha gösterilmez.
                    </p>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[13px] mb-3">
                      <div v-for="c in tfa.recoveryCodes" :key="c" class="bg-white rounded-md px-2 py-1 text-center">{{ c }}</div>
                    </div>
                    <div class="flex gap-2">
                      <button class="btn-secondary btn-sm" @click="copyRecovery">{{ tfa.copied ? 'Kopyalandı' : 'Kopyala' }}</button>
                      <button class="btn-primary btn-sm" @click="tfa.recoveryCodes = null; tfa.setup = false">Kaydettim</button>
                    </div>
                  </div>

                  <!-- Açıkken: kapatma -->
                  <div v-if="tfa.enabled && !tfa.recoveryCodes" class="mt-3 flex items-center gap-2 flex-wrap">
                    <span class="text-xs text-muted">{{ tfa.recoveryCodesLeft }} kurtarma kodu kaldı.</span>
                    <span class="flex-1"></span>
                    <input v-model="tfa.code" inputmode="numeric" maxlength="9" placeholder="Kod"
                           class="w-28 px-3 h-8 border border-gray-200 rounded-lg text-[13px] text-center bg-white"/>
                    <button class="btn-danger btn-sm" :disabled="tfa.busy" @click="disableTwoFactor">Kapat</button>
                  </div>
                  <div v-if="tfa.error" class="text-xs text-danger mt-2">{{ tfa.error }}</div>
                </div>
              </section>

              <!-- ══════════════ BİLDİRİMLER ══════════════ -->
              <section v-else-if="activeTab === 'notifications'">
                <SectionHeader title="Bildirim Tercihleri"
                               desc="Tüm olaylar panelde Bildirimler sayfasında görünür. Buradaki anahtarlar e-posta gönderimini açar."/>

                <div v-if="notif.loading" class="text-sm text-muted mb-6">Yükleniyor...</div>
                <template v-else>
                  <!-- E-posta sunucusu: işletme kendi hesabını girer -->
                  <div v-if="!smtp.open" class="mb-5 p-3 rounded-lg border text-[13px]"
                       :class="notif.smtpConfigured ? 'border-gray-200' : 'bg-amber-50 border-amber-200 text-amber-800'">
                    <template v-if="notif.smtpSource === 'tenant'">
                      <div class="flex items-center justify-between gap-3">
                        <div>
                          E-postalar <strong>{{ notif.smtp?.from }}</strong> adresinden gönderiliyor
                          <span class="text-muted">({{ notif.smtp?.host }})</span>.
                        </div>
                        <div class="flex gap-2 flex-shrink-0">
                          <button class="btn-secondary btn-sm" @click="openSmtp">Düzenle</button>
                          <button class="btn-danger btn-sm" @click="removeSmtp">Kaldır</button>
                        </div>
                      </div>
                    </template>
                    <template v-else-if="notif.smtpSource === 'system'">
                      <div class="flex items-center justify-between gap-3">
                        <span class="text-muted">E-postalar sistemin ortak sunucusundan gönderiliyor.</span>
                        <button class="btn-secondary btn-sm flex-shrink-0" @click="openSmtp">Kendi adresimden gönder</button>
                      </div>
                    </template>
                    <template v-else>
                      <div class="flex items-center justify-between gap-3">
                        <span>E-posta sunucusu ayarlanmamış: bildirimler yalnızca panelde görünür, e-posta gönderilmez.</span>
                        <button class="btn-primary btn-sm flex-shrink-0" @click="openSmtp">E-posta sunucusunu ayarla</button>
                      </div>
                    </template>
                  </div>

                  <div v-else class="mb-5 p-4 rounded-xl border border-gray-200">
                    <div class="text-sm font-semibold text-primary mb-1">E-posta sunucusu</div>
                    <p class="text-xs text-muted mb-3">
                      Bildirimler bu hesaptan gönderilir. Şifre şifrelenerek saklanır ve bir daha gösterilmez.
                    </p>

                    <div class="flex flex-wrap gap-2 mb-3">
                      <button v-for="p in SMTP_PRESETS" :key="p.label" type="button"
                              :class="smtp.host === p.host ? 'chip-accent' : 'chip-neutral'"
                              @click="smtp.host = p.host; smtp.port = p.port; smtp.enableSsl = true">{{ p.label }}</button>
                    </div>

                    <div class="grid grid-cols-3 gap-3 mb-3">
                      <div class="col-span-2">
                        <label class="field-label">Sunucu</label>
                        <input v-model="smtp.host" placeholder="smtp.ornek.com" autocomplete="off"
                               class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
                      </div>
                      <div>
                        <label class="field-label">Port</label>
                        <input v-model.number="smtp.port" type="number" min="1" max="65535"
                               class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
                      </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label class="field-label">Kullanıcı adı (e-posta)</label>
                        <input v-model="smtp.username" autocomplete="off" placeholder="isletme@gmail.com"
                               class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
                      </div>
                      <div>
                        <label class="field-label">Şifre</label>
                        <input v-model="smtp.password" type="password" autocomplete="new-password"
                               :placeholder="smtp.hasPassword ? 'Kayıtlı — değiştirmek için yazın' : 'Uygulama şifresi'"
                               class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
                      </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label class="field-label">Gönderen adresi</label>
                        <input v-model="smtp.from" autocomplete="off" :placeholder="smtp.username || 'isletme@gmail.com'"
                               class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
                      </div>
                      <div>
                        <label class="field-label">Gönderen adı</label>
                        <input v-model="smtp.fromName" placeholder="İşletmenizin adı"
                               class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
                      </div>
                    </div>
                    <label class="flex items-center gap-2 text-[13px] text-muted mb-3 cursor-pointer select-none">
                      <input v-model="smtp.enableSsl" type="checkbox" class="w-4 h-4"/> Güvenli bağlantı (TLS)
                    </label>

                    <p v-if="smtp.host.includes('gmail') || smtp.host.includes('office365') || smtp.host.includes('yahoo')"
                       class="text-xs text-muted mb-3 p-2.5 rounded-lg bg-gray-50">
                      Bu sağlayıcı hesabın normal şifresini kabul etmez: hesap güvenlik ayarlarında iki adımlı
                      doğrulamayı açıp <strong>uygulama şifresi</strong> üretin ve onu girin.
                    </p>

                    <div v-if="smtp.message" class="mb-3 text-[13px]"
                         :class="smtp.messageOk ? 'text-success' : 'text-danger'">{{ smtp.message }}</div>

                    <div class="flex gap-2">
                      <button class="btn-primary" :disabled="smtp.saving" @click="saveSmtp">
                        {{ smtp.saving ? 'Deneniyor...' : 'Kaydet ve test et' }}
                      </button>
                      <button class="btn-secondary" :disabled="smtp.saving" @click="smtp.open = false">Vazgeç</button>
                    </div>
                  </div>

                  <label class="field-label">Bildirim e-posta adresi</label>
                  <input v-model="notif.email" type="email"
                         :placeholder="notif.defaultEmail || 'ornek@isletme.com'"
                         class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white mb-1"/>
                  <p class="text-xs text-muted mb-5">
                    Boş bırakılırsa işletmenin kayıtlı adresi kullanılır{{ notif.defaultEmail ? ` (${notif.defaultEmail})` : '' }}.
                  </p>

                  <div class="space-y-3 mb-4">
                    <ToggleRow v-model="notif.emailZReport"
                               title="Z raporu özeti"
                               desc="Gün sonu Z raporu alındığında ciro, ödeme dağılımı ve kasa sayımı e-postayla gönderilir."/>
                    <ToggleRow v-model="notif.emailCashDifference"
                               title="Kasa farkı uyarısı"
                               desc="Z alınırken sayılan nakit beklenenden belirlenen tutardan fazla saparsa uyarır."/>
                    <div v-if="notif.emailCashDifference" class="flex items-center gap-3 pl-1">
                      <span class="text-[13px] text-muted">Uyarı eşiği</span>
                      <input v-model.number="notif.cashDifferenceThreshold" type="number" min="0" step="10"
                             class="w-28 px-3 h-9 border border-gray-200 rounded-lg text-[13.5px] bg-white text-right"/>
                      <span class="text-[13px] text-muted">₺ ve üzeri fark</span>
                    </div>
                    <ToggleRow v-model="notif.emailLowStock"
                               title="Kritik stok özeti"
                               desc="Kritik seviyedeki ürün ve hammaddeler günde bir kez listelenir (reçeteli ürünler hammaddeden izlenir)."/>
                    <ToggleRow v-model="notif.emailFailedLogin"
                               title="Hatalı giriş kilidi"
                               desc="Bir kullanıcı art arda hatalı şifre girip giriş geçici olarak kilitlendiğinde uyarır."/>
                  </div>

                  <div v-if="notif.message" class="mb-3 text-[13px]"
                       :class="notif.messageOk ? 'text-success' : 'text-danger'">{{ notif.message }}</div>

                  <div class="flex items-center gap-2 mb-6">
                    <button @click="saveNotif" :disabled="notif.saving" class="btn-primary">
                      {{ notif.saving ? 'Kaydediliyor...' : 'Kaydet' }}
                    </button>
                    <button @click="testNotif" :disabled="notif.testing || !notif.smtpConfigured" class="btn-secondary"
                            :title="notif.smtpConfigured ? 'Kayıtlı adrese deneme e-postası gönderir' : 'Önce SMTP yapılandırılmalı'">
                      {{ notif.testing ? 'Gönderiliyor...' : 'Test e-postası gönder' }}
                    </button>
                  </div>
                </template>

                <!-- Son hatalı giriş -->
                <div class="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <h4 class="text-sm font-bold text-primary mb-3">Oturum Güvenlik Logu</h4>

                  <div v-if="attemptsLoading"
                       class="flex items-center gap-2 text-sm text-muted">
                    <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Yükleniyor...
                  </div>

                  <template v-else-if="failedAttempts.length">
                    <div class="space-y-2">
                      <div v-for="(a, i) in failedAttempts.slice(0, 5)" :key="i"
                           class="flex items-center gap-3 text-xs">
                        <span class="w-2 h-2 rounded-full bg-danger flex-shrink-0"/>
                        <span class="text-danger font-semibold">Hatalı giriş</span>
                        <span class="text-muted">{{ a.ipAddress ?? '—' }}</span>
                        <span class="text-muted ml-auto">{{ fmtDate(a.attemptedAt) }}</span>
                      </div>
                    </div>
                    <p v-if="failedAttempts.length > 5"
                       class="text-xs text-muted mt-2">
                      +{{ failedAttempts.length - 5 }} daha fazla deneme
                    </p>
                  </template>

                  <div v-else class="text-sm text-success flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-success flex-shrink-0"/>
                    Son 30 günde hatalı giriş denemesi tespit edilmedi.
                  </div>
                </div>
              </section>

              <!-- ══════════════ DESTEK ══════════════ -->
              <section v-else-if="activeTab === 'support'">
                <SectionHeader title="Destek"
                               desc="Soru ve sorunlarınızı buradan iletin. Yanıt geldiğinde Bildirimler'de görünür."/>

                <!-- Açık yazışma -->
                <div v-if="support.selected" class="border border-gray-200 rounded-xl p-4 mb-6 h-[460px] flex flex-col">
                  <button class="text-xs font-bold text-accent hover:underline self-start mb-3"
                          @click="support.selected = null; loadSupport()">Taleplerime dön</button>
                  <SupportThread :ticket-id="support.selected" @changed="loadSupport"/>
                </div>

                <template v-else>
                  <!-- Yeni talep -->
                  <div class="border border-gray-200 rounded-xl p-4 mb-5">
                    <div class="text-sm font-semibold text-primary mb-3">Yeni destek talebi</div>
                    <input v-model="support.subject" maxlength="150" placeholder="Konu (ör. Fiş yazıcı basmıyor)"
                           class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white mb-2"/>
                    <textarea v-model="support.message" rows="4" maxlength="4000"
                              placeholder="Sorunu ve ne zaman olduğunu yazın. Hata mesajı varsa ekleyin."
                              class="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] bg-white resize-none mb-2"></textarea>
                    <div class="flex items-center justify-between gap-3">
                      <span class="text-xs" :class="support.error ? 'text-danger' : 'text-success'">
                        {{ support.error || support.sent }}
                      </span>
                      <button class="btn-primary btn-sm"
                              :disabled="support.busy || !support.subject.trim() || !support.message.trim()"
                              @click="createSupport">Gönder</button>
                    </div>
                  </div>

                  <!-- Taleplerim -->
                  <div class="text-sm font-semibold text-primary mb-2">Taleplerim</div>
                  <div class="border border-gray-200 rounded-xl divide-y divide-gray-100 mb-6">
                    <div v-if="!support.list.length" class="text-sm text-muted text-center py-5">Henüz talep yok.</div>
                    <button v-for="t in support.list" :key="t.id" @click="support.selected = t.id"
                            class="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between gap-3">
                      <div class="min-w-0">
                        <div class="text-sm font-semibold text-primary truncate">{{ t.subject }}</div>
                        <div class="text-xs text-muted">#{{ t.id }} · {{ timeAgo(t.updatedAt) }}</div>
                      </div>
                      <span class="flex-shrink-0"
                            :class="{ Open: 'chip-accent', Answered: 'chip-success', Closed: 'chip-neutral' }[t.status]">
                        {{ { Open: 'Yanıt bekliyor', Answered: 'Yanıtlandı', Closed: 'Kapalı' }[t.status] }}
                      </span>
                    </button>
                  </div>
                </template>

                <!-- Yenilikler -->
                <div class="flex items-center justify-between mb-3">
                  <h4 class="text-sm font-bold text-primary">Son yenilikler</h4>
                  <button class="text-xs font-bold text-muted hover:text-primary" @click="downloadLogs"
                          title="Destek ekibinin sorunu incelemesi için tarayıcıdaki uygulama durumunu indirir">
                    Sistem bilgisini indir
                  </button>
                </div>
                <div class="space-y-3">
                  <div v-for="entry in changelog" :key="entry.date"
                       class="relative pl-5 pb-3 border-l-2 border-gray-200 last:pb-0">
                    <div class="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-white border-2"
                         :class="entry.latest ? 'border-accent' : 'border-gray-300'"/>
                    <div class="text-xs font-bold mb-1" :class="entry.latest ? 'text-accent' : 'text-primary'">{{ entry.date }}</div>
                    <ul class="space-y-0.5">
                      <li v-for="note in entry.notes" :key="note" class="text-xs text-muted flex gap-1.5">
                        <span class="text-accent flex-shrink-0">+</span>{{ note }}
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              <!-- ── Veriler: satış verilerini sıfırlama talebi ─────────── -->
              <section v-else-if="activeTab === 'data'">
                <SectionHeader title="Satış verilerini sıfırla"
                               desc="Yeni bir döneme temiz başlamak için. Talebiniz destek ekibinin onayıyla uygulanır."/>

                <div class="grid grid-cols-2 gap-3 mb-4">
                  <div class="border border-red-100 bg-red-50/60 rounded-xl p-4">
                    <div class="text-xs font-bold text-red-700 uppercase tracking-wide mb-2">Silinecekler</div>
                    <ul class="text-xs text-red-900 space-y-1">
                      <li>Satışlar, fişler, Z raporları</li>
                      <li>İndirim, ikram ve iptal kayıtları</li>
                      <li>Masa adisyonları, QR siparişleri, mutfak biletleri</li>
                      <li>Stok hareketleri ve sayımlar — <b>stoklar 0 olur</b></li>
                      <li>Cari hareketleri ve faturalar — <b>bakiyeler 0 olur</b></li>
                      <li>Mesailer, rezervasyonlar, bildirimler</li>
                    </ul>
                  </div>
                  <div class="border border-green-100 bg-green-50/60 rounded-xl p-4">
                    <div class="text-xs font-bold text-green-700 uppercase tracking-wide mb-2">Kalacaklar</div>
                    <ul class="text-xs text-green-900 space-y-1">
                      <li>Ürünler, resimler, kategoriler, porsiyon ve ekler</li>
                      <li>Reçeteler, hammaddeler, tedarikçiler</li>
                      <li>QR menü resimleri, masalar, kampanyalar</li>
                      <li>Cari kartlar (bakiyesiz)</li>
                      <li>Kullanıcılar, ayarlar, fiş tasarımı, lisanslar</li>
                    </ul>
                  </div>
                </div>
                <p class="text-xs text-muted mb-5">
                  Onaylandıktan sonra kasalar bir sonraki bağlantıda kendi eski kayıtlarını da temizler (önce kasa yedeği alınır).
                  İşlem geri alınamaz; gerekirse silinen kayıtlar 30 gün içinde destek ekibinden istenebilir.
                </p>

                <div v-if="dataReset.pending" class="border border-blue-100 bg-blue-50/60 rounded-xl p-4 mb-5">
                  <div class="text-sm font-semibold text-primary">Talebiniz onay bekliyor</div>
                  <div class="text-xs text-muted mt-1">
                    {{ dataReset.pending.requestedBy }} · {{ timeAgo(dataReset.pending.createdAt) }} · “{{ dataReset.pending.reason }}”
                  </div>
                  <button class="btn-ghost btn-sm mt-2 text-danger" :disabled="dataReset.busy" @click="cancelDataReset">Talebi geri çek</button>
                </div>

                <div v-else class="border border-gray-200 rounded-xl p-4 mb-5">
                  <label class="field-label">Neden sıfırlamak istiyorsunuz?</label>
                  <textarea v-model="dataReset.reason" rows="2" maxlength="500"
                            placeholder="ör. Deneme amaçlı girilen satışlar; gerçek kullanıma başlıyoruz"
                            class="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] bg-white resize-none mb-3"></textarea>
                  <label class="field-label">Onay için işletme adını yazın: <b>{{ auth.tenantName }}</b></label>
                  <input v-model="dataReset.confirm" :placeholder="auth.tenantName"
                         class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white mb-3"/>
                  <div class="flex items-center justify-between gap-3">
                    <span class="text-xs" :class="dataReset.error ? 'text-danger' : 'text-success'">{{ dataReset.error || dataReset.sent }}</span>
                    <button class="btn-danger btn-sm"
                            :disabled="dataReset.busy || dataReset.reason.trim().length < 5 || !dataReset.confirm.trim()"
                            @click="createDataReset">Sıfırlama talebi gönder</button>
                  </div>
                </div>

                <div v-if="dataReset.history.length">
                  <div class="text-sm font-semibold text-primary mb-2">Geçmiş talepler</div>
                  <div class="border border-gray-200 rounded-xl divide-y divide-gray-100">
                    <div v-for="r in dataReset.history" :key="r.id" class="px-4 py-2.5 text-xs flex items-center justify-between gap-3">
                      <span class="text-muted truncate">{{ timeAgo(r.createdAt) }} · {{ r.requestedBy }} · “{{ r.reason }}”
                        <template v-if="r.rejectReason"> — {{ r.rejectReason }}</template></span>
                      <span class="flex-shrink-0 font-semibold"
                            :class="{ Completed: 'text-success', Rejected: 'text-danger', Failed: 'text-danger' }[r.status] || 'text-muted'">
                        {{ { Completed: 'Sıfırlandı', Rejected: 'Reddedildi', Cancelled: 'Geri çekildi', Failed: 'Yapılamadı' }[r.status] || r.status }}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, h, watch, reactive, computed } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { useAuthStore }     from '../stores/auth'
import api                  from '../api/api'
import SupportThread        from './SupportThread.vue'

const props = defineProps({ open: Boolean })
defineEmits(['update:open'])

const settings = useSettingsStore()
const auth     = useAuthStore()

const activeTab   = ref('ui')
// ─── Satış verilerini sıfırlama ──────────────────────────────────────────────
const dataReset = reactive({ pending: null, history: [], reason: '', confirm: '', busy: false, error: '', sent: '' })

async function loadDataReset() {
  try {
    const list = (await api.getMyDataResets()).data
    dataReset.pending = list.find(r => r.status === 'Pending') ?? null
    dataReset.history = list.filter(r => r.status !== 'Pending')
  } catch { /* eski API */ }
}

async function createDataReset() {
  if (!confirm('Sıfırlama talebi gönderilsin mi? Onaylanınca satış verileri silinir, stoklar ve cari bakiyeleri sıfırlanır.')) return
  dataReset.busy = true; dataReset.error = ''; dataReset.sent = ''
  try {
    await api.createDataReset({ reason: dataReset.reason.trim(), confirmName: dataReset.confirm.trim() })
    dataReset.reason = ''; dataReset.confirm = ''
    dataReset.sent = 'Talebiniz iletildi. Sonuç Bildirimler\'de görünecek.'
    await loadDataReset()
  } catch (e) {
    dataReset.error = e.response?.data?.message || 'Gönderilemedi.'
  } finally { dataReset.busy = false }
}

async function cancelDataReset() {
  if (!confirm('Sıfırlama talebi geri çekilsin mi?')) return
  dataReset.busy = true
  try { await api.cancelDataReset(dataReset.pending.id); await loadDataReset() }
  catch (e) { dataReset.error = e.response?.data?.message || 'Geri çekilemedi.' }
  finally { dataReset.busy = false }
}

// ─── Destek talepleri ───────────────────────────────────────────────────────
const support = reactive({ list: [], selected: null, subject: '', message: '', busy: false, error: '', sent: '' })

async function loadSupport() {
  try { support.list = (await api.getSupportTickets()).data } catch { /* eski API */ }
}

async function createSupport() {
  support.busy = true; support.error = ''; support.sent = ''
  try {
    const { data } = await api.createSupportTicket({ subject: support.subject.trim(), message: support.message.trim() })
    support.subject = ''; support.message = ''
    support.sent = `Talebiniz alındı (#${data.id}). Yanıt Bildirimler'de görünecek.`
    await loadSupport()
  } catch (e) {
    support.error = e.response?.data?.message || 'Gönderilemedi.'
  } finally { support.busy = false }
}

// ─── İki adımlı doğrulama ───────────────────────────────────────────────────
const tfa = reactive({ enabled: false, recoveryCodesLeft: 0, setup: false, secret: '', qr: '',
                      code: '', recoveryCodes: null, busy: false, error: '', copied: false })

async function loadTwoFactor() {
  try {
    const { data } = await api.getTwoFactor()
    tfa.enabled = data.enabled
    tfa.recoveryCodesLeft = data.recoveryCodesLeft
  } catch { /* eski API */ }
}

async function startTwoFactor() {
  tfa.busy = true; tfa.error = ''
  try {
    const { data } = await api.setupTwoFactor()
    tfa.secret = data.secret
    // QR tarayıcıda üretilir: gizli anahtar dış bir servise gönderilmez.
    const QRCode = (await import('qrcode')).default
    tfa.qr = await QRCode.toDataURL(data.otpauthUri, { width: 336, margin: 1 })
    tfa.code = ''
    tfa.setup = true
  } catch (e) {
    tfa.error = e.response?.data?.message || 'Kurulum başlatılamadı.'
  } finally { tfa.busy = false }
}

async function confirmTwoFactor() {
  tfa.busy = true; tfa.error = ''
  try {
    const { data } = await api.enableTwoFactor({ code: tfa.code })
    tfa.recoveryCodes = data.recoveryCodes
    tfa.enabled = true
    tfa.recoveryCodesLeft = data.recoveryCodes.length
    tfa.code = ''
  } catch (e) {
    tfa.error = e.response?.data?.message || 'Kod doğrulanamadı.'
  } finally { tfa.busy = false }
}

async function disableTwoFactor() {
  if (!tfa.code.trim()) { tfa.error = 'Kapatmak için uygulamadaki kodu ya da bir kurtarma kodunu girin.'; return }
  tfa.busy = true; tfa.error = ''
  try {
    await api.disableTwoFactor({ code: tfa.code.trim() })
    tfa.enabled = false
    tfa.code = ''
  } catch (e) {
    tfa.error = e.response?.data?.message || 'Kapatılamadı.'
  } finally { tfa.busy = false }
}

async function copyRecovery() {
  try {
    await navigator.clipboard.writeText(tfa.recoveryCodes.join('\n'))
    tfa.copied = true
    setTimeout(() => (tfa.copied = false), 2000)
  } catch { /* pano izni yok */ }
}

// ─── Güvenlik: aktif oturumlar ───────────────────────────────────────────────
const sessions        = ref([])
const sessionsLoading = ref(false)
const sessionsError   = ref(null)
const revoking        = ref(false)

async function loadSessions() {
  sessionsLoading.value = true
  sessionsError.value   = null
  try {
    const res = await api.getSessions()
    sessions.value = Array.isArray(res.data) ? res.data : (res.data?.sessions ?? [])
  } catch {
    sessionsError.value = 'Oturum bilgileri alınamadı.'
  } finally {
    sessionsLoading.value = false
  }
}

// ─── Bildirimler: hatalı giriş denemeleri ───────────────────────────────────
const failedAttempts  = ref([])
const attemptsLoading = ref(false)

async function loadFailedAttempts() {
  attemptsLoading.value = true
  try {
    const res = await api.getFailedAttempts()
    failedAttempts.value = Array.isArray(res.data)
      ? res.data
      : (res.data?.attempts ?? [])
  } catch {
    failedAttempts.value = []
  } finally {
    attemptsLoading.value = false
  }
}

// ─── Bildirim ayarları (sunucuda) ───────────────────────────────────────────
// Önceden yalnızca tarayıcıda saklanıyor, hiçbir şey göndermiyordu.
const notif = reactive({
  loading: false, saving: false, testing: false, message: '', messageOk: true,
  email: '', defaultEmail: '', smtpConfigured: false, smtpSource: null, smtp: null,
  emailZReport: false, emailCashDifference: true, emailLowStock: true, emailFailedLogin: true,
  cashDifferenceThreshold: 50,
})

async function loadNotif() {
  notif.loading = true
  notif.message = ''
  try {
    const { data } = await api.getNotificationSettings()
    Object.assign(notif, data)
  } catch {
    notif.message = 'Bildirim ayarları alınamadı.'
    notif.messageOk = false
  } finally {
    notif.loading = false
  }
}

async function saveNotif() {
  notif.saving = true
  notif.message = ''
  try {
    await api.saveNotificationSettings({
      email: notif.email,
      emailZReport: notif.emailZReport,
      emailCashDifference: notif.emailCashDifference,
      emailLowStock: notif.emailLowStock,
      emailFailedLogin: notif.emailFailedLogin,
      cashDifferenceThreshold: Number(notif.cashDifferenceThreshold) || 0,
    })
    notif.message = 'Kaydedildi.'
    notif.messageOk = true
  } catch (e) {
    notif.message = e.response?.status === 403
      ? 'Bu ayarı yalnızca yönetici değiştirebilir.'
      : (e.response?.data?.message || 'Kaydedilemedi.')
    notif.messageOk = false
  } finally {
    notif.saving = false
  }
}

// ─── İşletmenin kendi e-posta sunucusu ──────────────────────────────────────
const SMTP_PRESETS = [
  { label: 'Gmail',             host: 'smtp.gmail.com',      port: 587 },
  { label: 'Outlook / Hotmail', host: 'smtp.office365.com',  port: 587 },
  { label: 'Yandex',            host: 'smtp.yandex.com',     port: 587 },
  { label: 'Yahoo',             host: 'smtp.mail.yahoo.com', port: 587 },
]
const smtp = reactive({
  open: false, saving: false, message: '', messageOk: true,
  host: '', port: 587, username: '', password: '', from: '', fromName: '', enableSsl: true, hasPassword: false,
})

function openSmtp() {
  const s = notif.smtp
  Object.assign(smtp, {
    open: true, message: '', password: '',
    host: s?.host || '', port: s?.port || 587, username: s?.username || '',
    from: s?.from || '', fromName: s?.fromName || '', enableSsl: s?.enableSsl ?? true,
    hasPassword: !!s?.hasPassword,
  })
}

async function saveSmtp() {
  smtp.saving = true
  smtp.message = ''
  try {
    await api.saveSmtpSettings({
      host: smtp.host.trim(), port: Number(smtp.port) || 587,
      username: smtp.username.trim(), password: smtp.password,
      from: (smtp.from || smtp.username).trim(), fromName: smtp.fromName.trim(),
      enableSsl: smtp.enableSsl,
    })
  } catch (e) {
    smtp.message = e.response?.data?.message || 'Kaydedilemedi.'
    smtp.messageOk = false
    smtp.saving = false
    return
  }
  // Kaydedildi; gerçekten gidiyor mu, hemen dene.
  smtp.password = ''
  smtp.hasPassword = smtp.hasPassword || !!smtp.username
  try {
    const { data } = await api.sendTestNotification()
    await loadNotif()
    smtp.open = false
    notif.message = `E-posta sunucusu kaydedildi. ${data?.message || ''}`
    notif.messageOk = true
  } catch (e) {
    smtp.message = `Kaydedildi ama test e-postası gönderilemedi. ${e.response?.data?.message || ''}`
    smtp.messageOk = false
    await loadNotif()
  } finally {
    smtp.saving = false
  }
}

async function removeSmtp() {
  if (!confirm('Kendi e-posta sunucunuz kaldırılsın mı? Kayıtlı şifre silinir.')) return
  try {
    await api.deleteSmtpSettings()
    await loadNotif()
  } catch (e) {
    notif.message = e.response?.data?.message || 'Kaldırılamadı.'
    notif.messageOk = false
  }
}

async function testNotif() {
  notif.testing = true
  notif.message = ''
  try {
    const { data } = await api.sendTestNotification()
    notif.message = data?.message || 'Test e-postası gönderildi.'
    notif.messageOk = true
  } catch (e) {
    notif.message = e.response?.data?.message || 'Gönderilemedi.'
    notif.messageOk = false
  } finally {
    notif.testing = false
  }
}

// Modal açıldığında veya sekme değiştiğinde veri yükle
watch(() => props.open, open => {
  if (open) {
    loadSessions()
    loadTwoFactor()
    loadFailedAttempts()
  }
})

watch(activeTab, tab => {
  if (tab === 'security'      && !sessions.value.length)      loadSessions()
  if (tab === 'security') loadTwoFactor()
  if (tab === 'support') loadSupport()
  if (tab === 'data') loadDataReset()
  if (tab === 'notifications' && !failedAttempts.value.length) loadFailedAttempts()
  if (tab === 'notifications') loadNotif()
})

// ─── SVG ikon bileşenleri (inline, CDN yok) ──────────────────────────────────
const IconPalette = { render: () => h('svg', { fill:'none', stroke:'currentColor', viewBox:'0 0 24 24' },
  [h('path', { 'stroke-linecap':'round','stroke-linejoin':'round','stroke-width':'2',
    d:'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01'
  })]
)}

const IconShield = { render: () => h('svg', { fill:'none', stroke:'currentColor', viewBox:'0 0 24 24' },
  [h('path', { 'stroke-linecap':'round','stroke-linejoin':'round','stroke-width':'2',
    d:'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
  })]
)}

const IconBell = { render: () => h('svg', { fill:'none', stroke:'currentColor', viewBox:'0 0 24 24' },
  [h('path', { 'stroke-linecap':'round','stroke-linejoin':'round','stroke-width':'2',
    d:'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
  })]
)}

const IconLifebuoy = { render: () => h('svg', { fill:'none', stroke:'currentColor', viewBox:'0 0 24 24' },
  [h('path', { 'stroke-linecap':'round','stroke-linejoin':'round','stroke-width':'2',
    d:'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z'
  })]
)}

const IconMonitor = { render: () => h('svg', { fill:'none', stroke:'currentColor', viewBox:'0 0 24 24' },
  [h('path', { 'stroke-linecap':'round','stroke-linejoin':'round','stroke-width':'2',
    d:'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
  })]
)}

const IconPhone = { render: () => h('svg', { fill:'none', stroke:'currentColor', viewBox:'0 0 24 24' },
  [h('path', { 'stroke-linecap':'round','stroke-linejoin':'round','stroke-width':'2',
    d:'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z'
  })]
)}

// ─── Veri ────────────────────────────────────────────────────────────────────
const IconDatabase = { render: () => h('svg', { fill:'none', stroke:'currentColor', viewBox:'0 0 24 24' },
  [h('path', { 'stroke-linecap':'round','stroke-linejoin':'round','stroke-width':'2',
    d:'M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zm0 0v10c0 1.7 3.6 3 8 3s8-1.3 8-3V7M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3'
  })]
)}

// "Veriler" (sıfırlama talebi) yalnızca işletme yöneticisine
const tabs = computed(() => [
  { id: 'ui',            label: 'Görünüm',    icon: IconPalette  },
  { id: 'security',      label: 'Güvenlik',   icon: IconShield   },
  { id: 'notifications', label: 'Bildirimler',icon: IconBell     },
  { id: 'support',       label: 'Destek',     icon: IconLifebuoy },
  ...(auth.isAdmin && !auth.isSuperAdmin ? [{ id: 'data', label: 'Veriler', icon: IconDatabase }] : []),
])

const themeOptions = [
  {
    value: 'light', label: 'Açık Tema',
    topBg: 'bg-gray-200', bodyBg: 'bg-white', lineBg: 'bg-gray-400', dotColor: 'bg-gray-500',
  },
  {
    value: 'dark', label: 'Koyu Tema',
    topBg: 'bg-gray-800', bodyBg: 'bg-gray-900', lineBg: 'bg-gray-500', dotColor: 'bg-gray-400',
  },
  {
    value: 'system', label: 'Sistem',
    topBg: 'bg-gradient-to-r from-gray-800 to-gray-200',
    bodyBg: 'bg-gradient-to-r from-gray-900 to-white',
    lineBg: 'bg-gray-500', dotColor: 'bg-gray-500',
  },
]

const changelog = [
  { date: 'Ekim 2026', latest: true, notes: [
    'Faturalar sunucuya kaydediliyor; cari hesaba ve stoğa işleniyor, iptal edilebiliyor',
    'Kasa carileri panelle bağlandı; açık hesap borçları ve tahsilatlar tek yerde',
    'Açık hesap ödeme türü ve parçalı ödemede açık hesap payı',
    'Kampanyalar: saatlik indirim, X al Y öde, sepet indirimi',
    'Sipariş önerisi: tüketim hızına göre tedarikçi bazlı alım listesi',
    'Mutfak ekranı ve kasada "sipariş hazır" bildirimi',
    'İki adımlı doğrulama ve panel içi destek talepleri',
  ] },
  { date: 'Eylül 2026', latest: false, notes: [
    'QR menüden masaya sipariş',
    'Kasa sayımı ve e-posta bildirimleri',
    'Yeni panel ve kasa tasarımı',
  ] },
]

// ─── Aksiyonlar ──────────────────────────────────────────────────────────────
function isMobile(deviceInfo) {
  const d = (deviceInfo ?? '').toLowerCase()
  return d.includes('iphone') || d.includes('android') || d.includes('mobile') || d.includes('ipad')
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 1)   return 'Az önce'
  if (mins < 60)  return `${mins} dakika önce`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} saat önce`
  const days  = Math.floor(hours / 24)
  return `${days} gün önce`
}

function fmtDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

async function logoutAll() {
  if (!confirm('Diğer tüm cihazlardaki oturumları kapatmak istediğinize emin misiniz?')) return
  revoking.value = true
  try {
    await api.revokeAllSessions()
    await loadSessions()
  } catch {
    alert('İşlem sırasında hata oluştu.')
  } finally {
    revoking.value = false
  }
}

function downloadLogs() {
  const payload = {
    timestamp:   new Date().toISOString(),
    appVersion:  'v1.5.0',
    userAgent:   navigator.userAgent,
    tenant:      auth.tenantName ?? 'bilinmiyor',
    user:        auth.username   ?? 'bilinmiyor',
    localStorage: Object.fromEntries(
      Object.keys(localStorage).map(k => {
        try { return [k, JSON.parse(localStorage.getItem(k))] }
        catch { return [k, localStorage.getItem(k)] }
      })
    ),
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `satiskasasi-log-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function openSupportTicket() {
  const subject = encodeURIComponent('SatışKasası Destek Talebi')
  const body    = encodeURIComponent(
    `Kullanıcı: ${auth.username ?? ''}\nFirma: ${auth.tenantName ?? ''}\nSürüm: v1.5.0\n\nSorun:\n`
  )
  window.location.href = `mailto:destek@satiskasasi.com?subject=${subject}&body=${body}`
}
</script>

<!-- Alt bileşenler -->
<script>
import { h as hh } from 'vue'

// Paneldeki Vue sürümü şablon derleyicisi içermiyor: "template" metniyle
// tanımlanan bileşenler hiç çizilmiyordu (bölüm başlıkları ve anahtarlar
// görünmüyordu). Render fonksiyonu derleyici gerektirmez.

// SectionHeader yardımcı bileşeni
export const SectionHeader = {
  props: ['title', 'desc'],
  render() {
    return hh('div', { class: 'mb-5' }, [
      hh('h3', { class: 'section-title mb-1' }, this.title),
      hh('p', { class: 'text-sm text-muted' }, this.desc),
      hh('div', { class: 'mt-4 border-t border-gray-100' }),
    ])
  },
}

// ToggleRow yardımcı bileşeni
export const ToggleRow = {
  props: ['modelValue', 'title', 'desc'],
  emits: ['update:modelValue'],
  render() {
    const on = !!this.modelValue
    return hh('div', {
      class: 'flex items-start justify-between gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors',
    }, [
      hh('div', [
        hh('div', { class: 'text-sm font-semibold text-primary' }, this.title),
        hh('div', { class: 'text-xs text-muted mt-0.5' }, this.desc),
      ]),
      hh('button', {
        type: 'button',
        role: 'switch',
        'aria-checked': on,
        onClick: () => this.$emit('update:modelValue', !on),
        class: ['relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out flex-shrink-0 mt-0.5',
                on ? 'bg-accent' : 'bg-gray-300'],
      }, [
        hh('span', {
          class: ['inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200',
                  on ? 'translate-x-6' : 'translate-x-1'],
        }),
      ]),
    ])
  },
}
</script>
