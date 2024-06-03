const { getAbsoluteServerUrl } = require("@strapi/utils");

// TODO: AGREGAR ENLACES DE DESCARGA DE TIENDAS EN EL CORREO

const verificationEmail = `
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
  <!--[if (gte mso 9)|(IE)]>
  <xml>
    <o:OfficeDocumentSettings>
    <o:AllowPNG/>
    <o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings>
</xml>
<![endif]-->
  <meta http-equiv="Content-Type" content="text/html;charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1"> <!-- So that mobile will display zoomed in -->
  <meta http-equiv="X-UA-Compatible" content="IE=edge"> <!-- enable media queries for windows phone 8 -->
  <meta name="format-detection" content="telephone=no"> <!-- disable auto telephone linking in iOS -->
  <meta name="format-detection" content="date=no"> <!-- disable auto date linking in iOS -->
  <meta name="format-detection" content="address=no"> <!-- disable auto address linking in iOS -->
  <meta name="format-detection" content="email=no"> <!-- disable auto email linking in iOS -->
  <meta name="color-scheme" content="only">
  <title></title>
  <link rel="preconnect" href="https://fonts.gstatic.com">
  <link
    href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&amp;display=swap"
    rel="stylesheet">
  <style type="text/css">
    /*Basics*/
    body {
      margin: 0px !important;
      padding: 0px !important;
      display: block !important;
      min-width: 100% !important;
      width: 100% !important;
      -webkit-text-size-adjust: none;
    }

    table {
      border-spacing: 0;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }

    table td {
      border-collapse: collapse;
      mso-line-height-rule: exactly;
    }

    td img {
      -ms-interpolation-mode: bicubic;
      width: auto;
      max-width: auto;
      height: auto;
      margin: auto;
      display: block !important;
      border: 0px;
    }

    td p {
      margin: 0;
      padding: 0;
    }

    td div {
      margin: 0;
      padding: 0;
    }

    td a {
      text-decoration: none;
      color: inherit;
    }

    /*Outlook*/
    .ExternalClass {
      width: 100%;
    }

    .ExternalClass,
    .ExternalClass p,
    .ExternalClass span,
    .ExternalClass font,
    .ExternalClass td,
    .ExternalClass div {
      line-height: inherit;
    }

    .ReadMsgBody {
      width: 100%;
      background-color: #ffffff;
    }

    /* iOS BLUE LINKS */
    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }

    /*Gmail blue links*/
    u+#body a {
      color: inherit;
      text-decoration: none;
      font-size: inherit;
      font-family: inherit;
      font-weight: inherit;
      line-height: inherit;
    }

    /*Buttons fix*/
    .undoreset a,
    .undoreset a:hover {
      text-decoration: none !important;
    }

    .yshortcuts a {
      border-bottom: none !important;
    }

    .ios-footer a {
      color: #aaaaaa !important;
      text-decoration: none;
    }

    /*Responsive-Tablet*/
    @media only screen and (max-width:799px) and (min-width:601px) {
      .outer-table.row {
        width: 640px !important;
        max-width: 640px !important;
      }

      .inner-table.row {
        width: 600px !important;
        max-width: 600px !important;
      }
    }

    /*Responsive-Mobile*/
    @media only screen and (max-width:600px) and (min-width:320px) {
      table.row {
        width: 100% !important;
        max-width: 100% !important;
      }

      td.row {
        width: 100% !important;
        max-width: 100% !important;
      }

      .img-responsive img {
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
        margin: auto;
      }

      .center-float {
        float: none !important;
        margin: auto !important;
      }

      .center-text {
        text-align: center !important;
      }

      .container-padding {
        width: 100% !important;
        padding-left: 15px !important;
        padding-right: 15px !important;
      }

      .container-padding10 {
        width: 100% !important;
        padding-left: 10px !important;
        padding-right: 10px !important;
      }

      .container-padding25 {
        width: 100% !important;
        padding-left: 25px !important;
        padding-right: 25px !important;
      }

      .hide-mobile {
        display: none !important;
      }

      .menu-container {
        text-align: center !important;
      }

      .autoheight {
        height: auto !important;
      }

      .m-padding-10 {
        margin: 10px 0 !important;
      }

      .m-padding-15 {
        margin: 15px 0 !important;
      }

      .m-padding-20 {
        margin: 20px 0 !important;
      }

      .m-padding-30 {
        margin: 30px 0 !important;
      }

      .m-padding-40 {
        margin: 40px 0 !important;
      }

      .m-padding-50 {
        margin: 50px 0 !important;
      }

      .m-padding-60 {
        margin: 60px 0 !important;
      }

      .m-padding-top10 {
        margin: 30px 0 0 0 !important;
      }

      .m-padding-top15 {
        margin: 15px 0 0 0 !important;
      }

      .m-padding-top20 {
        margin: 20px 0 0 0 !important;
      }

      .m-padding-top30 {
        margin: 30px 0 0 0 !important;
      }

      .m-padding-top40 {
        margin: 40px 0 0 0 !important;
      }

      .m-padding-top50 {
        margin: 50px 0 0 0 !important;
      }

      .m-padding-top60 {
        margin: 60px 0 0 0 !important;
      }

      .m-height10 {
        font-size: 10px !important;
        line-height: 10px !important;
        height: 10px !important;
      }

      .m-height15 {
        font-size: 15px !important;
        line-height: 15px !important;
        height: 15px !important;
      }

      .m-height20 {
        font-size: 20px !important;
        line-height: 20px !important;
        height: 20px !important;
      }

      .m-height25 {
        font-size: 25px !important;
        line-height: 25px !important;
        height: 25px !important;
      }

      .m-height30 {
        font-size: 30px !important;
        line-height: 30px !important;
        height: 30px !important;
      }

      .rwd-on-mobile {
        display: inline-block !important;
        padding: 5px !important;
      }

      .center-on-mobile {
        text-align: center !important;
      }

      .rwd-col {
        width: 100% !important;
        max-width: 100% !important;
        display: inline-block !important;
      }
    }
  </style>

  <link rel="stylesheet"
    href="https://fonts.googleapis.com/css?family=Poppins:100,100italic,200,200italic,300,300italic,400,400italic,500,500italic,600,600italic,700,700italic,800,800italic,900,900italic">
</head>

<body
  style="margin-top:0;margin-bottom:0;padding-top:0;padding-bottom:0;width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;"
  bgcolor="#090e3d">
  <span class="preheader-text"
    style="color:transparent;height:0;max-height:0;max-width:0;opacity:0;overflow:hidden;visibility:hidden;width:0;display:none;mso-hide:all;"></span>
  <!-- Preheader white space hack -->
  <div style="display:none;max-height:0px;overflow:hidden;">
    &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table border="0" align="center" cellpadding="0" cellspacing="0" width="100%" style="width:100%;max-width:100%;">
    <tbody>
      <tr><!-- Outer Table -->
        <td align="center" bgcolor="#090e3d">
          <table border="0" align="center" cellpadding="0" cellspacing="0" role="presentation"
            class="row container-padding" width="640" style="width:640px;max-width:640px;">
            <!-- Preheader -->
            <tbody>
              <tr>
                <td height="20" style="font-size:20px;line-height:20px;">&nbsp;</td>
              </tr>
              <tr>
                <td class="center-text" align="right">
                  <a href="#"
                    style="font-family:Poppins, Arial, Helvetica, sans-serif;font-size:12px;line-height:16px;font-style:normal;font-weight:400;color:rgb(102, 102, 102);text-decoration:none;letter-spacing:0px;"></a>
                </td>
              </tr>
              <tr>
                <td height="20" style="font-size:30px;line-height:20px;">&nbsp;</td>
              </tr>
              <tr>
                <td align="center" class="center-text">
                  <img style="width:200px;border:0px;display:inline!important;"
                    src="${ getAbsoluteServerUrl( strapi.config ) }/uploads/MARCA_ALBARRAN_GASOLINERAS_WHITE_07958a949c.png"
                    width="200" border="0" alt="logo">
                </td>
              </tr>
              <tr>
                <td height="20" style="font-size:30px;line-height:20px;">&nbsp;</td>
              </tr>
              <!-- Preheader -->
            </tbody>
          </table>
          <table border="0" align="center" cellpadding="0" cellspacing="0" class="row" role="presentation" width="640"
            style="width:640px;max-width:640px;">
            <!-- simpli-header-5 -->
            <tbody>
              <tr>
                <td align="center">
                  <table border="0" align="center" cellpadding="0" cellspacing="0" role="presentation"
                    class="row container-padding25" width="600" style="width:600px;max-width:600px;">
                    <!-- basic-info -->
                    <tbody>
                      <tr>
                        <td align="center" bgcolor="#ffffff"
                          style="border-radius:16px;border-bottom:6px solid rgb(221, 221, 221);">
                          <!-- content -->
                          <table border="0" align="center" cellpadding="0" cellspacing="0" role="presentation"
                            class="row container-padding" width="520"
                            style="width:520px;max-width:520px;margin: 40px 0;">
                            <tbody>
                              <tr style="">
                                <td class="center-text" align="center"
                                  style="font-family:Poppins, Arial, Helvetica, sans-serif;font-size:12px;line-height:24px;font-weight:700;font-style:normal;color:rgb(1, 151, 246);text-decoration:none;letter-spacing:2px;">

                                  <div style="margin: 0px; padding: 0px;">
                                    <p style="margin: 0px; padding: 0px;">VERIFICA TU CUENTA</p>
                                  </div>

                                </td>
                              </tr>
                              <tr>
                                <td class="center-text" align="center"
                                  style="font-family:Poppins, Arial, Helvetica, sans-serif;font-size:36px;line-height:46px;font-weight:500;font-style:normal;color:rgb(20, 24, 27);text-decoration:none;letter-spacing:0px;">

                                  <div style="margin: 0px; padding: 0px;">
                                    <p style="margin: 0px; padding: 0px;">
                                      ¡Bienvenido!</p>
                                  </div>

                                </td>
                              </tr>
                              <tr>
                                <td height="15" style="font-size:15px;line-height:15px;">&nbsp;</td>
                              </tr>
                              <tr style="">
                                <td class="center-text" align="center"
                                  style="font-family:Poppins, Arial, Helvetica, sans-serif;font-size:12px;line-height:22px;font-weight:400;font-style:normal;color:rgb(20, 24, 27);text-decoration:none;letter-spacing:0px;text-align:center;">

                                  <div style="margin: 0px; padding: 0px;">
                                    <p style="margin: 0px; padding: 0px;">Gracias por crear tu cuenta con nosotros,
                                      estas muy cerca de empezar a recibir beneficios por tu consumo. Ingresa tu código
                                      de verificación en tu aplicación para que podamos validar tu identidad.</p>
                                  </div>

                                </td>
                              </tr>
                              <tr style="">
                                <td height="25" style="font-size:25px;line-height:25px;">&nbsp;</td>
                              </tr>
                              <tr style="">
                                <td align="center">
                                  <!-- Use Code -->
                                  <table border="0" cellspacing="0" cellpadding="0" role="presentation" align="center"
                                    class="row" width="480" style="width:480px;max-width:480px;">
                                    <tbody>
                                      <tr>
                                        <td align="center" bgcolor="#fef5ef"
                                          style="border-radius:16px;border:2px dotted rgb(221, 221, 221);">
                                          <!-- Content -->
                                          <table border="0" cellspacing="0" cellpadding="0" role="presentation"
                                            align="center" class="row" width="480" style="width:480px;max-width:480px;">
                                            <tbody>
                                              <tr>
                                                <td height="20" style="font-size:20px;line-height:20px;">&nbsp;</td>
                                              </tr>
                                              <tr>
                                                <td class="center-text" align="center"
                                                  style="font-family:Poppins, Arial, Helvetica, sans-serif;font-size:18px;line-height:22px;font-weight:700;font-style:normal;color:rgb(20, 24, 27);text-decoration:none;letter-spacing:2px;">

                                                  <div style="margin: 0px; padding: 0px;">
                                                    <p style="margin: 0px; padding: 0px;">
                                                      TU CÓDIGO: <font color="#e2001a"><%= code %></font>
                                                    </p>
                                                  </div>

                                                </td>
                                              </tr>
                                              <tr>
                                                <td height="20" style="font-size:20px;line-height:20px;">&nbsp;</td>
                                              </tr>
                                            </tbody>
                                          </table>
                                          <!-- Content -->
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                  <!-- User Code -->
                                </td>
                              </tr>



                            </tbody>
                          </table>
                          <!-- content -->
                        </td>
                      </tr>
                      <!-- basic-info -->
                    </tbody>
                  </table>
                </td>
              </tr>
              <!-- simpli-header-5 -->
            </tbody>
          </table>
          <table border="0" align="center" cellpadding="0" cellspacing="0" role="presentation" width="100%"
            style="width:100%;max-width:100%;">
            <!-- simpli-footer -->
            <tbody>
              <tr>
                <td align="center">
                  <!-- Content -->
                  <table border="0" align="center" cellpadding="0" cellspacing="0" role="presentation"
                    class="row container-padding" width="520" style="width:520px;max-width:520px;">
                    <tbody>
                      <tr>
                        <td height="40" style="font-size: 40px;line-height: 40px;">&nbsp;</td>
                      </tr>




                      <tr>
                        <td align="center">
                          <table border="0" align="center" cellpadding="0" cellspacing="0" role="presentation"
                            class="row" width="480" style="width:480px;max-width:480px;">
                            <tbody>
                              <tr>
                                <td class="center-text" align="center"
                                  style="font-family:Poppins, Arial, Helvetica, sans-serif;font-size:12px;line-height:24px;font-weight:480;font-style:normal;color:rgb(255, 255, 255);text-decoration:none;letter-spacing:0px;">

                                  <div style="margin: 0px; padding: 0px;">
                                    <p style="margin: 0px; padding: 0px;">
                                      Descarga la aplicación para <strong>Android</strong> y <strong>iOS</strong>.</p>
                                    <p style="margin: 0px; padding: 0px;"><br></p>
                                  </div>

                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>

                      <tr style="">
                        <td align="center">
                          <!-- Buttons -->
                          <table border="0" align="center" cellpadding="0" cellspacing="0" role="presentation"
                            class="row" width="100%" style="width:100%;max-width:100%;">
                            <tbody>
                              <tr>
                                <td align="center">
                                  <!-- column -->
                                  <table border="0" align="center" cellpadding="0" cellspacing="0" role="presentation">
                                    <tbody>
                                      <tr style="">
                                        <td align="center">
                                          <img style="display:block;width:100%;max-width:117px;border:0px;" width="117"
                                            src="https://modulescomposer.s3.us-east-2.amazonaws.com/simpli/App-Store.png"
                                            border="0" alt="icon">
                                        </td>
                                        <td width="10" style="width:10px;"></td>
                                        <td align="center">
                                          <img style="display:block;width:100%;max-width:117px;border:0px;" width="117"
                                            src="https://modulescomposer.s3.us-east-2.amazonaws.com/simpli/Google-play.png"
                                            border="0" alt="icon">
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                  <!-- column -->
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <!-- Buttons -->
                        </td>
                      </tr>
                      <tr style="">
                        <td height="40" style="font-size:40px;line-height:40px;">&nbsp;</td>
                      </tr>



                      <tr>
                        <td align="center">
                          <table border="0" align="center" cellpadding="0" cellspacing="0" role="presentation"
                            class="row" width="480" style="width:480px;max-width:480px;">
                            <tbody>
                              <tr>
                                <td class="center-text" align="center"
                                  style="font-family:Poppins, Arial, Helvetica, sans-serif;font-size:12px;line-height:24px;font-weight:480;font-style:normal;color:rgb(255, 255, 255);text-decoration:none;letter-spacing:0px;">

                                  <div style="margin: 0px; padding: 0px;">
                                    <p style="margin: 0px; padding: 0px;">Copyright © 2024 Albarran</p>
                                    <p style="margin: 0px; padding: 0px;"><br></p>
                                    <p style="margin: 0px;padding: 0px;font-weight: 300;font-size: 10px;">Este mensaje
                                      fue enviado de manera automática,
                                      por favor, no responda este correo.</p>
                                  </div>

                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>


                      <tr>
                        <td height="50" style="font-size:50px;line-height:50px;">&nbsp;</td>
                      </tr>
                    </tbody>
                  </table>
                  <!-- Content -->
                </td>
              </tr>
              <!-- simpli-footer -->
            </tbody>
          </table>
        </td>
      </tr><!-- Outer-Table -->
    </tbody>
  </table>


</body>

</html>
`;

module.exports = verificationEmail;